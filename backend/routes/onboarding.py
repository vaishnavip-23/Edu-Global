from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User, Onboarding
from backend.schemas import OnboardingRequest, OnboardingResponse

router = APIRouter(prefix="/api/onboarding", tags=["onboarding"])


class OnboardingRequestWithUserID(OnboardingRequest):
    clerk_user_id: str
    email: str = ""


@router.post("/submit", response_model=OnboardingResponse)
async def submit_onboarding(
    data: OnboardingRequestWithUserID,
    db: Session = Depends(get_db),
):
    """Submit onboarding data and mark user as onboarding_complete"""
    clerk_user_id = data.clerk_user_id

    # Get or create user
    user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()

    if not user:
        # Create new user
        user = User(
            clerk_user_id=clerk_user_id,
            email=data.email or "",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Create or update onboarding record
    onboarding = db.query(Onboarding).filter(Onboarding.user_id == user.id).first()

    if not onboarding:
        onboarding = Onboarding(user_id=user.id)

    # Update fields with proper type conversion
    onboarding.education_level = data.education_level
    onboarding.degree_major = data.degree_major
    onboarding.graduation_year = int(data.graduation_year) if data.graduation_year else None
    onboarding.gpa = data.gpa
    onboarding.target_degree = data.target_degree
    onboarding.field_of_study = data.field_of_study
    # Parse year from "Fall 2026" -> 2026
    if data.target_intake_year:
        try:
            onboarding.target_intake_year = int(data.target_intake_year.split()[-1])
        except (ValueError, IndexError):
            onboarding.target_intake_year = None
    else:
        onboarding.target_intake_year = None
    onboarding.preferred_countries = data.preferred_countries
    onboarding.budget_range = data.budget_range
    onboarding.funding_plan = data.funding_plan
    onboarding.ielts_status = data.ielts_status
    onboarding.toefl_status = data.toefl_status
    onboarding.gre_status = data.gre_status
    onboarding.gmat_status = data.gmat_status
    onboarding.sop_status = data.sop_status

    db.add(onboarding)

    # Mark user as onboarding complete only on final submit
    if data.is_final_submit:
        user.onboarding_complete = True
        db.add(user)

    db.commit()
    db.refresh(onboarding)

    return onboarding


@router.get("/status/{clerk_user_id}")
async def get_onboarding_status(
    clerk_user_id: str,
    db: Session = Depends(get_db),
):
    """Check if user has completed onboarding"""
    user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()

    if not user:
        return {"onboarding_complete": False}

    return {"onboarding_complete": user.onboarding_complete}


@router.get("/{clerk_user_id}", response_model=OnboardingResponse)
async def get_onboarding(
    clerk_user_id: str,
    db: Session = Depends(get_db),
):
    """Get user's onboarding data"""
    user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    onboarding = db.query(Onboarding).filter(Onboarding.user_id == user.id).first()

    if not onboarding:
        raise HTTPException(status_code=404, detail="Onboarding data not found")

    return onboarding
