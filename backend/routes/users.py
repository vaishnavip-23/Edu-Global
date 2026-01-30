"""User / me endpoint for current user and stage."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Onboarding, Todo, Shortlist
from auth import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me")
async def get_current_user_info(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Return current user info including current_stage for dashboard."""
    clerk_user_id = current_user["clerk_user_id"]
    user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "status": "success",
        "user": {
            "user_id": user.id,
            "clerk_user_id": user.clerk_user_id,
            "email": user.email,
            "onboarding_complete": user.onboarding_complete,
            "current_stage": user.current_stage,
        },
    }


@router.get("/dashboard-data")
async def get_dashboard_data(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Return all dashboard data in a single request to reduce API calls.
    Includes user info, onboarding data, todos, and locked count.
    """
    try:
        clerk_user_id = current_user["clerk_user_id"]

        # Get user
        user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # STRICT: Check onboarding completion
        if not user.onboarding_complete:
            raise HTTPException(
                status_code=403,
                detail="Onboarding not complete. Please complete onboarding first."
            )

        # Get onboarding data
        onboarding = db.query(Onboarding).filter(Onboarding.user_id == user.id).first()
        onboarding_data = None
        if onboarding:
            onboarding_data = {
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

        # Get todos
        todos = db.query(Todo).filter(Todo.user_id == user.id).order_by(Todo.created_at.desc()).all()
        todos_data = [
            {
                "id": todo.id,
                "title": todo.title,
                "description": todo.description,
                "status": todo.status,
                "priority": todo.priority,
                "category": todo.category,
                "university_id": todo.university_id,
                "stage": todo.stage,
                "created_at": todo.created_at.isoformat(),
            }
            for todo in todos
        ]

        # Get locked count
        locked_count = db.query(Shortlist).filter(
            Shortlist.user_id == user.id,
            Shortlist.locked == True
        ).count()

        return {
            "status": "success",
            "user": {
                "user_id": user.id,
                "clerk_user_id": user.clerk_user_id,
                "email": user.email,
                "onboarding_complete": user.onboarding_complete,
                "current_stage": user.current_stage,
            },
            "onboarding": onboarding_data,
            "todos": todos_data,
            "locked_count": locked_count,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching dashboard data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching dashboard data: {str(e)}")
