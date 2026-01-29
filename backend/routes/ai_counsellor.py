from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from backend.database import get_db
from backend.models import User, Onboarding, Shortlist, Todo
from backend.services.ai_counsellor_service import ai_counsellor_service
from backend.services.university_service import university_service
from backend.auth import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai-counsellor", tags=["ai-counsellor"])


class ChatMessage(BaseModel):
    message: str
    conversation_history: Optional[List[Dict[str, str]]] = []


class ChatResponse(BaseModel):
    message: str
    tool_calls: List[Dict[str, Any]]
    tool_results: List[Dict[str, Any]]


def execute_tool_call(
    tool_name: str,
    arguments: Dict,
    user: User,
    db: Session
) -> Dict:
    """Execute a tool call and return the result"""
    try:
        if tool_name == "get_user_profile":
            return get_user_profile_tool(user, db)

        elif tool_name == "get_recommended_universities":
            limit = arguments.get("limit", 5)
            return get_recommended_universities_tool(user, db, limit)

        elif tool_name == "shortlist_university":
            university_id = arguments.get("university_id")
            return shortlist_university_tool(user, db, university_id)

        elif tool_name == "lock_university":
            university_id = arguments.get("university_id")
            return lock_university_tool(user, db, university_id)

        elif tool_name == "create_todo":
            return create_todo_tool(user, db, arguments)

        elif tool_name == "get_shortlisted_universities":
            return get_shortlisted_universities_tool(user, db)

        elif tool_name == "get_todos":
            return get_todos_tool(user, db)

        else:
            return {"error": f"Unknown tool: {tool_name}"}

    except Exception as e:
        logger.error(f"Error executing tool {tool_name}: {str(e)}")
        return {"error": str(e)}


def get_user_profile_tool(user: User, db: Session) -> Dict:
    """Get user profile information"""
    onboarding = db.query(Onboarding).filter(Onboarding.user_id == user.id).first()
    if not onboarding:
        return {"error": "Profile not found"}

    return {
        "education_level": onboarding.education_level,
        "degree_major": onboarding.degree_major,
        "graduation_year": onboarding.graduation_year,
        "gpa": onboarding.gpa,
        "target_degree": onboarding.target_degree,
        "field_of_study": onboarding.field_of_study,
        "target_intake_year": onboarding.target_intake_year,
        "preferred_countries": onboarding.preferred_countries,
        "budget_range": onboarding.budget_range,
        "funding_plan": onboarding.funding_plan,
        "ielts_status": onboarding.ielts_status,
        "toefl_status": onboarding.toefl_status,
        "gre_status": onboarding.gre_status,
        "gmat_status": onboarding.gmat_status,
        "sop_status": onboarding.sop_status,
    }


def get_recommended_universities_tool(user: User, db: Session, limit: int = 5) -> Dict:
    """Get recommended universities"""
    onboarding = db.query(Onboarding).filter(Onboarding.user_id == user.id).first()
    if not onboarding:
        return {"error": "Profile not found"}

    # Parse user data
    preferred_countries = []
    if onboarding.preferred_countries:
        preferred_countries = [c.strip() for c in onboarding.preferred_countries.split(",")]

    budget_max = None
    if onboarding.budget_range:
        try:
            budget_str = onboarding.budget_range.split("-")[-1].strip()
            budget_max = float(budget_str.replace("$", "").replace(",", ""))
        except:
            pass

    user_gpa = None
    if onboarding.gpa:
        try:
            user_gpa = float(onboarding.gpa)
        except:
            pass

    # Get recommendations
    recommendations = university_service.get_recommended_universities(
        target_degree=onboarding.target_degree,
        field_of_study=onboarding.field_of_study,
        preferred_countries=preferred_countries,
        budget_max=budget_max,
        target_intake_year=onboarding.target_intake_year,
        user_gpa=user_gpa,
    )

    # Limit results
    return {
        "dream": recommendations["dream"][:limit],
        "target": recommendations["target"][:limit],
        "safe": recommendations["safe"][:limit],
    }


def shortlist_university_tool(user: User, db: Session, university_id: str) -> Dict:
    """Shortlist a university"""
    # Check if university exists
    university = university_service.get_university_by_id(university_id)
    if not university:
        return {"error": "University not found"}

    # Check if already shortlisted
    existing = db.query(Shortlist).filter(
        Shortlist.user_id == user.id,
        Shortlist.university_id == university_id
    ).first()

    if existing:
        return {"success": False, "message": "University already shortlisted"}

    # Add to shortlist
    shortlist = Shortlist(
        user_id=user.id,
        university_id=university_id,
        category=university.get("category", "Target"),
        match_score=university.get("match_score", 0),
        locked=False
    )
    db.add(shortlist)
    db.commit()

    return {
        "success": True,
        "message": f"Added {university.get('university_name')} to shortlist",
        "university_name": university.get("university_name"),
    }


def lock_university_tool(user: User, db: Session, university_id: str) -> Dict:
    """Lock a university"""
    shortlist = db.query(Shortlist).filter(
        Shortlist.user_id == user.id,
        Shortlist.university_id == university_id
    ).first()

    if not shortlist:
        return {"error": "University not shortlisted"}

    shortlist.locked = True
    db.commit()

    # Update user stage to 4 if locking first university
    if user.current_stage < 4:
        user.current_stage = 4
        db.commit()

    university = university_service.get_university_by_id(university_id)
    return {
        "success": True,
        "message": f"Locked {university.get('university_name') if university else university_id}",
        "stage_updated": True,
    }


def create_todo_tool(user: User, db: Session, arguments: Dict) -> Dict:
    """Create a to-do task"""
    todo = Todo(
        user_id=user.id,
        title=arguments.get("title"),
        description=arguments.get("description"),
        priority=arguments.get("priority", "medium"),
        category=arguments.get("category", "general"),
        stage=user.current_stage,
    )
    db.add(todo)
    db.commit()

    return {
        "success": True,
        "message": f"Created task: {todo.title}",
        "task_id": todo.id,
    }


def get_shortlisted_universities_tool(user: User, db: Session) -> Dict:
    """Get user's shortlisted universities"""
    shortlist_entries = db.query(Shortlist).filter(Shortlist.user_id == user.id).all()

    universities = []
    for entry in shortlist_entries:
        uni = university_service.get_university_by_id(entry.university_id)
        if uni:
            universities.append({
                "id": entry.university_id,
                "name": uni.get("university_name"),
                "country": uni.get("country"),
                "category": entry.category,
                "locked": entry.locked,
            })

    return {
        "count": len(universities),
        "universities": universities,
    }


def get_todos_tool(user: User, db: Session) -> Dict:
    """Get user's to-do list"""
    todos = db.query(Todo).filter(
        Todo.user_id == user.id,
        Todo.status != "completed"
    ).order_by(Todo.created_at.desc()).all()

    return {
        "count": len(todos),
        "todos": [
            {
                "id": todo.id,
                "title": todo.title,
                "description": todo.description,
                "status": todo.status,
                "priority": todo.priority,
                "category": todo.category,
            }
            for todo in todos
        ],
    }


@router.post("/chat", response_model=ChatResponse)
async def chat_with_counsellor(
    chat_message: ChatMessage,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Chat with AI Counsellor
    The AI can call tools to take actions (shortlist, lock, create tasks, etc.)
    """
    try:
        clerk_user_id = current_user["clerk_user_id"]

        # Get user
        user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Check onboarding
        if not user.onboarding_complete:
            raise HTTPException(
                status_code=403,
                detail="Please complete onboarding before using AI Counsellor"
            )

        # Get user profile
        onboarding = db.query(Onboarding).filter(Onboarding.user_id == user.id).first()

        # Get shortlist counts
        shortlist_count = db.query(Shortlist).filter(Shortlist.user_id == user.id).count()
        locked_count = db.query(Shortlist).filter(
            Shortlist.user_id == user.id,
            Shortlist.locked == True
        ).count()

        # Build user context with FULL profile information
        user_context = {
            "stage": user.current_stage,
            "shortlisted_count": shortlist_count,
            "locked_count": locked_count,
            "profile": {
                "education_level": onboarding.education_level,
                "degree_major": onboarding.degree_major,
                "graduation_year": onboarding.graduation_year,
                "gpa": onboarding.gpa,
                "target_degree": onboarding.target_degree,
                "field_of_study": onboarding.field_of_study,
                "target_intake_year": onboarding.target_intake_year,
                "preferred_countries": onboarding.preferred_countries,
                "budget_range": onboarding.budget_range,
                "funding_plan": onboarding.funding_plan,
                "ielts_status": onboarding.ielts_status,
                "toefl_status": onboarding.toefl_status,
                "gre_status": onboarding.gre_status,
                "gmat_status": onboarding.gmat_status,
                "sop_status": onboarding.sop_status,
            } if onboarding else {}
        }

        # Call AI Counsellor
        response = await ai_counsellor_service.chat(
            message=chat_message.message,
            user_context=user_context,
            conversation_history=chat_message.conversation_history,
        )

        # Execute tool calls if any
        tool_results = []
        if response.get("tool_calls"):
            for tool_call in response["tool_calls"]:
                result = execute_tool_call(
                    tool_call["name"],
                    tool_call["arguments"],
                    user,
                    db
                )
                tool_results.append({
                    "tool": tool_call["name"],
                    "result": result,
                })

        return ChatResponse(
            message=response["message"],
            tool_calls=response.get("tool_calls", []),
            tool_results=tool_results,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in AI Counsellor chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/profile-strength")
async def get_profile_strength(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get AI-generated profile strength analysis"""
    try:
        clerk_user_id = current_user["clerk_user_id"]

        user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        onboarding = db.query(Onboarding).filter(Onboarding.user_id == user.id).first()
        if not onboarding:
            raise HTTPException(status_code=404, detail="Profile not found")

        profile_data = {
            "gpa": onboarding.gpa,
            "ielts_status": onboarding.ielts_status,
            "toefl_status": onboarding.toefl_status,
            "gre_status": onboarding.gre_status,
            "gmat_status": onboarding.gmat_status,
            "sop_status": onboarding.sop_status,
        }

        strength = ai_counsellor_service.analyze_profile_strength(profile_data)

        return {
            "status": "success",
            "strength": strength,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting profile strength: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
