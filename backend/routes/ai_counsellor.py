from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from backend.database import get_db
from backend.models import User, Onboarding, Shortlist, Todo, Application
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
            university_name = arguments.get("university_name")
            return shortlist_university_tool(user, db, university_id, university_name)

        elif tool_name == "lock_university":
            university_id = arguments.get("university_id")
            university_name = arguments.get("university_name")
            return lock_university_tool(user, db, university_id, university_name)

        elif tool_name == "create_todo":
            return create_todo_tool(user, db, arguments)

        elif tool_name == "get_shortlisted_universities":
            return get_shortlisted_universities_tool(user, db)

        elif tool_name == "get_todos":
            return get_todos_tool(user, db)

        elif tool_name == "delete_todo":
            todo_id = arguments.get("todo_id")
            todo_title = arguments.get("todo_title")
            return delete_todo_tool(user, db, todo_id, todo_title)

        elif tool_name == "remove_from_shortlist":
            university_id = arguments.get("university_id")
            university_name = arguments.get("university_name")
            return remove_from_shortlist_tool(user, db, university_id, university_name)

        elif tool_name == "unlock_university":
            university_id = arguments.get("university_id")
            university_name = arguments.get("university_name")
            return unlock_university_tool(user, db, university_id, university_name)

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


def shortlist_university_tool(user: User, db: Session, university_id: str = None, university_name: str = None) -> Dict:
    """Shortlist a university by ID or name"""
    try:
        # If name provided but no ID, search for the university by name
        if university_name and not university_id:
            all_universities = university_service.get_all_universities()
            university = None
            for uni in all_universities:
                if uni.get("name", "").lower() == university_name.lower():
                    university_id = uni.get("id")
                    university = uni
                    break

            if not university:
                return {"error": f"University '{university_name}' not found. Please check the spelling or ask for recommendations first."}
        else:
            # Check if university exists by ID
            university = university_service.get_university_by_id(university_id)
            if not university:
                return {"error": "University not found"}

        # Check if already shortlisted
        existing = db.query(Shortlist).filter(
            Shortlist.user_id == user.id,
            Shortlist.university_id == university_id
        ).first()

        if existing:
            return {
                "success": False,
                "message": "University already shortlisted",
                "university_name": university.get("university_name"),
            }

        # Get user's onboarding data to calculate match score
        onboarding = db.query(Onboarding).filter(Onboarding.user_id == user.id).first()
        
        # Extract user scores for matching
        user_gpa = None
        user_gre = None
        user_gmat = None
        user_ielts = None
        user_toefl = None
        user_budget = None
        user_countries = None
        
        if onboarding:
            # Parse GPA
            if onboarding.gpa and onboarding.gpa != "Not Applicable":
                try:
                    import re
                    numbers = re.findall(r'\d+\.?\d*', onboarding.gpa)
                    if numbers:
                        user_gpa = float(numbers[0])
                except (ValueError, TypeError):
                    pass
            
            # Parse exam scores
            user_gre = None
            if onboarding.gre_quant_score and onboarding.gre_verbal_score:
                user_gre = onboarding.gre_quant_score + onboarding.gre_verbal_score
            
            user_gmat = onboarding.gmat_score
            user_ielts = onboarding.ielts_score
            user_toefl = onboarding.toefl_score
            
            # Parse budget
            if onboarding.budget_range:
                try:
                    budget_str = onboarding.budget_range.split("-")[-1].strip()
                    user_budget = float(budget_str.replace("$", "").replace(",", ""))
                except (ValueError, AttributeError, IndexError):
                    pass
            
            # Parse countries
            if onboarding.preferred_countries:
                user_countries = [c.strip() for c in onboarding.preferred_countries.split(",")]
        
        # Score the university
        scored_university = university_service.score_university(
            university,
            user_gpa=user_gpa,
            user_gre=user_gre,
            user_gmat=user_gmat,
            user_ielts=user_ielts,
            user_toefl=user_toefl,
            user_budget=user_budget,
            user_countries=user_countries,
        )
        
        match_score = scored_university.get("match_score", 0)
        category = scored_university.get("category", "Target")

        # Add to shortlist
        shortlist = Shortlist(
            user_id=user.id,
            university_id=university_id,
            category=category,
            match_score=match_score,
            locked=False
        )
        db.add(shortlist)

        # Stage progression: first shortlist moves from stage 2 to 3
        shortlist_count = db.query(Shortlist).filter(Shortlist.user_id == user.id).count()
        if shortlist_count == 0 and user.current_stage == 2:
            user.current_stage = 3
            db.add(user)

        # Commit both in single transaction
        db.commit()

        return {
            "success": True,
            "message": f"✓ Added {university.get('university_name')} to your shortlist (Match Score: {match_score}/100). Please confirm this action.",
            "university_name": university.get("university_name"),
            "match_score": match_score,
            "category": category,
            "action": "shortlist",
            "requires_confirmation": True,
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Error shortlisting university: {str(e)}")
        return {"error": f"Failed to shortlist university: {str(e)}"}


def lock_university_tool(user: User, db: Session, university_id: str = None, university_name: str = None) -> Dict:
    """Lock a university (commitment step) by ID or name"""
    try:
        # If name provided but no ID, find it in the user's shortlist
        if university_name and not university_id:
            shortlisted = db.query(Shortlist).filter(Shortlist.user_id == user.id).all()
            for sl in shortlisted:
                uni = university_service.get_university_by_id(sl.university_id)
                if uni and uni.get("university_name", "").lower() == university_name.lower():
                    university_id = sl.university_id
                    break

            if not university_id:
                return {"error": f"'{university_name}' not found in your shortlist. Please shortlist it first."}

        shortlist = db.query(Shortlist).filter(
            Shortlist.user_id == user.id,
            Shortlist.university_id == university_id
        ).first()

        if not shortlist:
            return {"error": "University not in shortlist. Shortlist it first."}

        shortlist.locked = True

        # Create Application record for this locked university
        existing_application = db.query(Application).filter(
            Application.user_id == user.id,
            Application.shortlist_id == shortlist.id
        ).first()
        
        if not existing_application:
            application = Application(
                user_id=user.id,
                shortlist_id=shortlist.id,
                university_id=university_id,
                status="in_progress"
            )
            db.add(application)

        # Update user stage to 4 if locking first university
        if user.current_stage < 4:
            user.current_stage = 4
            db.add(user)

        # Get university details
        university = university_service.get_university_by_id(university_id)
        uni_name = university.get("university_name") if university else university_id

        # Auto-generate application todos for this university
        existing_todos = db.query(Todo).filter(
            Todo.user_id == user.id,
            Todo.university_id == university_id
        ).count()

        if existing_todos == 0:
            # Get exam requirements
            exam_reqs = university.get("examRequirements", {}) if university else {}

            todos_to_create = [
                {
                    "title": f"Complete Statement of Purpose (SOP) for {uni_name}",
                    "description": "Write a compelling SOP highlighting your goals, background, and why this university is the right fit for you.",
                    "priority": "high",
                    "category": "documents",
                },
                {
                    "title": f"Secure 2-3 Letters of Recommendation (LOR)",
                    "description": "Request LORs from professors or employers who know your work well. Give them at least 2-4 weeks notice.",
                    "priority": "high",
                    "category": "documents",
                },
                {
                    "title": f"Prepare official transcripts",
                    "description": "Request official transcripts from your current/previous universities. Some institutions may take 2-3 weeks to process.",
                    "priority": "high",
                    "category": "documents",
                },
                {
                    "title": f"Complete application form for {uni_name}",
                    "description": "Fill out the online application form with accurate information. Save drafts regularly.",
                    "priority": "high",
                    "category": "application",
                },
                {
                    "title": f"Prepare financial documents",
                    "description": "Gather bank statements, sponsor letters, or scholarship documents to prove financial capability.",
                    "priority": "medium",
                    "category": "documents",
                },
            ]

            # Add exam-specific todos
            if exam_reqs.get("ielts", {}).get("required") or exam_reqs.get("toefl", {}).get("required"):
                ielts_min = exam_reqs.get("ielts", {}).get("minScore", 6.5)
                toefl_min = exam_reqs.get("toefl", {}).get("minScore", 90)
                todos_to_create.append({
                    "title": f"Take English proficiency test (IELTS {ielts_min}+ or TOEFL {toefl_min}+)",
                    "description": "Schedule and take IELTS or TOEFL exam. Results typically available in 2 weeks.",
                    "priority": "high",
                    "category": "exam",
                })

            if exam_reqs.get("gre", {}).get("required"):
                gre_min = exam_reqs.get("gre", {}).get("minTotal", 310)
                todos_to_create.append({
                    "title": f"Take GRE exam (target: {gre_min}+)",
                    "description": "Prepare for and take the GRE exam. Allow 2-3 months for preparation.",
                    "priority": "high",
                    "category": "exam",
                })

            if exam_reqs.get("gmat", {}).get("required"):
                gmat_min = exam_reqs.get("gmat", {}).get("minScore", 650)
                todos_to_create.append({
                    "title": f"Take GMAT exam (target: {gmat_min}+)",
                    "description": "Prepare for and take the GMAT exam. Allow 2-3 months for preparation.",
                    "priority": "high",
                    "category": "exam",
                })

            # Create todos
            for todo_data in todos_to_create:
                todo = Todo(
                    user_id=user.id,
                    university_id=university_id,
                    title=todo_data["title"],
                    description=todo_data["description"],
                    priority=todo_data["priority"],
                    category=todo_data["category"],
                    stage=4,
                    status="pending",
                )
                db.add(todo)

        # Commit all changes
        db.commit()

        return {
            "success": True,
            "message": f"🔒 Successfully locked {uni_name}. You're now committed to this choice. Moving to Stage 4: Application Preparation. {len(todos_to_create) if existing_todos == 0 else 0} tasks created.",
            "university_name": uni_name,
            "stage_updated": True,
            "action": "lock",
            "requires_confirmation": True,
            "tasks_created": len(todos_to_create) if existing_todos == 0 else 0,
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Error locking university: {str(e)}")
        return {"error": f"Failed to lock university: {str(e)}"}


def create_todo_tool(user: User, db: Session, arguments: Dict) -> Dict:
    """Create a to-do task"""
    try:
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
        db.refresh(todo)

        return {
            "success": True,
            "message": f"Created task: {todo.title}",
            "task_id": todo.id,
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating todo: {str(e)}")
        return {"error": f"Failed to create task: {str(e)}"}


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


def delete_todo_tool(user: User, db: Session, todo_id: int = None, todo_title: str = None) -> Dict:
    """Delete a todo by ID or title"""
    try:
        # If title provided but no ID, search for the todo by title
        if todo_title and not todo_id:
            todos = db.query(Todo).filter(Todo.user_id == user.id).all()
            todo = None
            for t in todos:
                if t.title.lower() == todo_title.lower() or todo_title.lower() in t.title.lower():
                    todo = t
                    break

            if not todo:
                return {"error": f"Todo '{todo_title}' not found."}
        else:
            todo = db.query(Todo).filter(
                Todo.id == todo_id,
                Todo.user_id == user.id
            ).first()

            if not todo:
                return {"error": "Todo not found."}

        todo_title_deleted = todo.title
        db.delete(todo)
        db.commit()

        return {
            "success": True,
            "message": f"Deleted todo: {todo_title_deleted}",
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting todo: {str(e)}")
        return {"error": f"Failed to delete todo: {str(e)}"}


def remove_from_shortlist_tool(user: User, db: Session, university_id: str = None, university_name: str = None) -> Dict:
    """Remove a university from shortlist by ID or name"""
    try:
        # If name provided but no ID, find it in the user's shortlist
        if university_name and not university_id:
            shortlisted = db.query(Shortlist).filter(Shortlist.user_id == user.id).all()
            shortlist_entry = None
            for sl in shortlisted:
                uni = university_service.get_university_by_id(sl.university_id)
                if uni and uni.get("university_name", "").lower() == university_name.lower():
                    university_id = sl.university_id
                    shortlist_entry = sl
                    break

            if not shortlist_entry:
                return {"error": f"'{university_name}' not found in your shortlist."}
        else:
            shortlist_entry = db.query(Shortlist).filter(
                Shortlist.user_id == user.id,
                Shortlist.university_id == university_id
            ).first()

            if not shortlist_entry:
                return {"error": "University not in your shortlist."}

        # Check if locked
        if shortlist_entry.locked:
            return {"error": f"{university_name or 'This university'} is locked. Unlock it first before removing."}

        university = university_service.get_university_by_id(university_id)
        uni_name = university.get("university_name") if university else university_id

        db.delete(shortlist_entry)
        db.commit()

        return {
            "success": True,
            "message": f"Removed {uni_name} from your shortlist.",
            "university_name": uni_name,
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Error removing from shortlist: {str(e)}")
        return {"error": f"Failed to remove from shortlist: {str(e)}"}


def unlock_university_tool(user: User, db: Session, university_id: str = None, university_name: str = None) -> Dict:
    """Unlock a locked university by ID or name"""
    try:
        # If name provided but no ID, find it in the user's shortlist
        if university_name and not university_id:
            shortlisted = db.query(Shortlist).filter(Shortlist.user_id == user.id).all()
            shortlist_entry = None
            for sl in shortlisted:
                uni = university_service.get_university_by_id(sl.university_id)
                if uni and uni.get("university_name", "").lower() == university_name.lower():
                    university_id = sl.university_id
                    shortlist_entry = sl
                    break

            if not shortlist_entry:
                return {"error": f"'{university_name}' not found in your shortlist."}
        else:
            shortlist_entry = db.query(Shortlist).filter(
                Shortlist.user_id == user.id,
                Shortlist.university_id == university_id
            ).first()

            if not shortlist_entry:
                return {"error": "University not in your shortlist."}

        if not shortlist_entry.locked:
            return {"error": f"{university_name or 'This university'} is not locked."}

        shortlist_entry.locked = False

        university = university_service.get_university_by_id(university_id)
        uni_name = university.get("university_name") if university else university_id

        db.commit()

        return {
            "success": True,
            "message": f"Unlocked {uni_name}. You can now remove it from your shortlist if needed.",
            "university_name": uni_name,
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Error unlocking university: {str(e)}")
        return {"error": f"Failed to unlock university: {str(e)}"}


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

        # Agentic loop: call AI, execute tools, feed results back
        all_tool_results = []
        conversation_history = list(chat_message.conversation_history) if chat_message.conversation_history else []
        max_iterations = 3  # Prevent infinite loops
        iteration = 0
        
        while iteration < max_iterations:
            iteration += 1
            logger.info(f"Agentic loop iteration {iteration}")
            
            response = await ai_counsellor_service.chat(
                message=chat_message.message,
                user_context=user_context,
                conversation_history=conversation_history,
            )

            # Check if AI made tool calls
            if not response.get("tool_calls"):
                # No more tool calls, break loop
                logger.info("No tool calls in this iteration, breaking loop")
                break
            
            logger.info(f"Executing {len(response['tool_calls'])} tool calls in iteration {iteration}")
            
            # Execute each tool call
            iteration_results = []
            has_action_tool = False

            for tool_call in response["tool_calls"]:
                logger.info(f"Executing tool: {tool_call['name']} with args: {tool_call.get('arguments', {})}")
                result = execute_tool_call(
                    tool_call["name"],
                    tool_call["arguments"],
                    user,
                    db
                )
                logger.info(f"Tool result: {result}")
                iteration_results.append({
                    "tool": tool_call["name"],
                    "result": result,
                })
                all_tool_results.append({
                    "tool": tool_call["name"],
                    "result": result,
                })

                # Check if this is an action tool (single execution)
                action_tools = [
                    "create_todo", "delete_todo",
                    "shortlist_university", "remove_from_shortlist",
                    "lock_university", "unlock_university"
                ]
                if tool_call["name"] in action_tools:
                    has_action_tool = True

            # For action tools (create_todo, shortlist, lock), break after execution
            # to prevent duplicate calls in the next iteration
            if has_action_tool:
                logger.info("Action tool executed, breaking loop to prevent duplicates")
                break

            # Add user message to history
            conversation_history.append({"role": "user", "content": chat_message.message})

            # Add AI response with tool calls to history (for context)
            conversation_history.append({"role": "assistant", "content": f"Calling {len(response['tool_calls'])} tools"})

            # Continue loop to let AI make more tool calls if needed
        
        # After agentic loop, get final natural response
        if all_tool_results:
            logger.info(f"Feeding {len(all_tool_results)} tool results back to AI for natural response")
            
            # Build tool results for the model
            tool_results_text = "Based on the information I retrieved:\n\n"
            for tool_result in all_tool_results:
                tool_name = tool_result["tool"]
                result = tool_result["result"]
                
                if tool_name == "get_user_profile":
                    tool_results_text += f"User Profile:\n"
                    tool_results_text += f"- Education: {result.get('education_level')} in {result.get('degree_major')}\n"
                    tool_results_text += f"- GPA: {result.get('gpa')}\n"
                    tool_results_text += f"- Target: {result.get('target_degree')} in {result.get('field_of_study')}\n"
                    tool_results_text += f"- Target Intake: {result.get('target_intake_year')}\n"
                    tool_results_text += f"- Preferred Countries: {result.get('preferred_countries')}\n"
                    tool_results_text += f"- Budget: {result.get('budget_range')}\n"
                    tool_results_text += f"- English Exam: {result.get('ielts_status')} / {result.get('toefl_status')}\n"
                    tool_results_text += f"- Standardized Tests: GRE {result.get('gre_status')} / GMAT {result.get('gmat_status')}\n"
                    tool_results_text += f"- SOP Status: {result.get('sop_status')}\n\n"
                elif tool_name == "get_recommended_universities":
                    tool_results_text += f"University Recommendations:\n"
                    for category in ["dream", "target", "safe"]:
                        if result.get(category):
                            tool_results_text += f"\n{category.upper()} Schools:\n"
                            for uni in result[category]:
                                tool_results_text += f"- {uni.get('university_name')} ({uni.get('country')})\n"
                elif tool_name == "get_shortlisted_universities":
                    tool_results_text += f"Shortlisted Universities: {len(result.get('universities', []))}\n"
                    for uni in result.get('universities', []):
                        locked = " 🔒" if uni.get('locked') else ""
                        tool_results_text += f"- {uni.get('name')}{locked}\n"
                elif tool_name == "get_todos":
                    tool_results_text += f"Your Tasks: {len(result.get('todos', []))}\n"
                    for todo in result.get('todos', []):
                        tool_results_text += f"- {todo.get('title')} [{todo.get('priority')}]\n"
                elif tool_name == "create_todo":
                    if result.get("success"):
                        tool_results_text += f"✓ Task created: {result.get('message')}\n"
                        tool_results_text += f"The task is now visible in the Dashboard.\n"
                    else:
                        tool_results_text += f"Error creating task: {result.get('error')}\n"
                elif tool_name == "shortlist_university":
                    if result.get("success"):
                        tool_results_text += f"✓ Shortlisted: {result.get('university_name')}\n"
                        tool_results_text += f"Match Score: {result.get('match_score')}/100\n"
                        tool_results_text += f"Category: {result.get('category')}\n"
                    else:
                        tool_results_text += f"Error: {result.get('error') or result.get('message')}\n"
                elif tool_name == "lock_university":
                    if result.get("success"):
                        tool_results_text += f"✓ Locked: {result.get('university_name')}\n"
                        tool_results_text += f"Tasks created: {result.get('tasks_created', 0)}\n"
                        tool_results_text += f"Check the Application Preparation page for your tasks.\n"
                    else:
                        tool_results_text += f"Error: {result.get('error')}\n"
                elif tool_name == "delete_todo":
                    if result.get("success"):
                        tool_results_text += f"✓ Deleted task: {result.get('message')}\n"
                    else:
                        tool_results_text += f"Error: {result.get('error')}\n"
                elif tool_name == "remove_from_shortlist":
                    if result.get("success"):
                        tool_results_text += f"✓ Removed from shortlist: {result.get('university_name')}\n"
                    else:
                        tool_results_text += f"Error: {result.get('error')}\n"
                elif tool_name == "unlock_university":
                    if result.get("success"):
                        tool_results_text += f"✓ Unlocked: {result.get('university_name')}\n"
                        tool_results_text += f"{result.get('message')}\n"
                    else:
                        tool_results_text += f"Error: {result.get('error')}\n"
            
            # Call AI again with tool results to get a natural response
            # Use minimal conversation history to avoid system prompt contamination
            # Just include the current user question for context
            clean_history = [
                {"role": "user", "content": chat_message.message}
            ]

            # For follow-up, use a direct analysis without tool calling
            follow_up_response = ai_counsellor_service.analyze_with_context(
                question=chat_message.message,
                tool_results_text=tool_results_text,
                user_context=user_context,
                conversation_history=clean_history,
            )
            
            logger.info(f"Returning response with natural analysis (not displaying tool results separately)")
            
            # Return natural response without showing tool results separately since AI has already analyzed them
            return ChatResponse(
                message=follow_up_response["message"],
                tool_calls=[],
                tool_results=[],  # Don't show tool results separately - AI has already analyzed them
            )
        else:
            # No tool calls, just return the AI response
            logger.info("No tool calls made, returning direct response")
            return ChatResponse(
                message=response["message"],
                tool_calls=[],
                tool_results=[],
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in AI Counsellor chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/application/{shortlist_id}")
async def get_application_details(
    shortlist_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get application details for a specific locked university"""
    try:
        clerk_user_id = current_user["clerk_user_id"]
        
        user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get the shortlist entry
        shortlist = db.query(Shortlist).filter(
            Shortlist.id == shortlist_id,
            Shortlist.user_id == user.id
        ).first()
        
        if not shortlist:
            raise HTTPException(status_code=404, detail="University not found in your shortlist")
        
        # Get application record
        application = db.query(Application).filter(
            Application.shortlist_id == shortlist_id
        ).first()
        
        # Get university details
        university = university_service.get_university_by_id(shortlist.university_id)
        
        # Get all todos for this university
        todos = db.query(Todo).filter(
            Todo.user_id == user.id,
            Todo.university_id == shortlist.university_id
        ).all()
        
        return {
            "status": "success",
            "application": {
                "university_id": shortlist.university_id,
                "university_name": university.get("university_name") if university else shortlist.university_id,
                "country": university.get("country") if university else "Unknown",
                "status": application.status if application else "in_progress",
                "locked": shortlist.locked,
            },
            "tasks": [
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
            "progress": {
                "total_tasks": len(todos),
                "completed_tasks": len([t for t in todos if t.status == "completed"]),
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting application details: {str(e)}")
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

        analysis = ai_counsellor_service.analyze_profile_strength(profile_data)

        return {
            "status": "success",
            "analysis": analysis,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting profile strength: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
