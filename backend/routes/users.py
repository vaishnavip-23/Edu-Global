"""User / me endpoint for current user and stage."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User
from backend.auth import get_current_user
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
