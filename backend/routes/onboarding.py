from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from backend.database import get_db
from backend.models import User, Onboarding
from backend.schemas import OnboardingRequest, OnboardingResponse
from backend.auth import get_current_user
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/onboarding", tags=["onboarding"])


class OnboardingRequestWithUserID(OnboardingRequest):
    clerk_user_id: str
    email: str = ""


@router.post("/sync-user")
async def sync_user_to_db(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Create or update user in database after Clerk authentication"""
    clerk_user_id = current_user["clerk_user_id"]
    email = current_user.get("email", "")
    
    try:
        logger.info(f"Syncing user to database: {clerk_user_id}")
        
        # Check if user exists
        user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()
        
        if not user:
            logger.info(f"Creating new user: {clerk_user_id}")
            user = User(
                clerk_user_id=clerk_user_id,
                email=email,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.info(f"User synced successfully: {clerk_user_id}")
        else:
            logger.info(f"User already exists: {clerk_user_id}")
        
        return {
            "status": "success",
            "clerk_user_id": clerk_user_id,
            "user_id": user.id,
            "onboarding_complete": user.onboarding_complete
        }
    
    except Exception as e:
        db.rollback()
        logger.error(f"Error syncing user: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error syncing user: {str(e)}"
        )


@router.post("/submit", response_model=OnboardingResponse)
async def submit_onboarding(
    data: OnboardingRequestWithUserID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Submit onboarding data and mark user as onboarding_complete"""
    # Verify the authenticated user matches the data being submitted
    clerk_user_id = current_user["clerk_user_id"]

    if clerk_user_id != data.clerk_user_id:
        raise HTTPException(
            status_code=403,
            detail="Cannot submit onboarding data for another user"
        )

    logger.info(f"Submitting onboarding for user: {clerk_user_id}")

    try:
        # Get or create user
        user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()

        if not user:
            logger.info(f"Creating new user: {clerk_user_id}")
            # Create new user
            user = User(
                clerk_user_id=clerk_user_id,
                email=data.email or current_user.get("email", ""),
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.info(f"User created with ID: {user.id}")

        # Create or update onboarding record
        onboarding = db.query(Onboarding).filter(Onboarding.user_id == user.id).first()

        if not onboarding:
            logger.info(f"Creating new onboarding record for user_id: {user.id}")
            onboarding = Onboarding(user_id=user.id)
        else:
            logger.info(f"Updating existing onboarding record: {onboarding.id}")

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

        # Mark user as onboarding complete only on final submit; advance to stage 2
        if data.is_final_submit:
            logger.info(f"Marking onboarding as complete for user: {clerk_user_id}")
            user.onboarding_complete = True
            if user.current_stage < 2:
                user.current_stage = 2  # Discovering Universities
            db.add(user)

        db.commit()
        db.refresh(onboarding)

        logger.info(f"Onboarding data saved successfully for user: {clerk_user_id}")
        return onboarding

    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error while saving onboarding: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error while saving onboarding: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error saving onboarding data: {str(e)}"
        )


@router.get("/status/{clerk_user_id}")
async def get_onboarding_status(
    clerk_user_id: str,
    db: Session = Depends(get_db),
):
    """Check if user has completed onboarding"""
    try:
        logger.info(f"Checking onboarding status for user: {clerk_user_id}")
        user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()

        if not user:
            logger.info(f"User not found: {clerk_user_id}")
            return {"onboarding_complete": False}

        logger.info(f"User found. Onboarding complete: {user.onboarding_complete}")
        return {"onboarding_complete": user.onboarding_complete}

    except Exception as e:
        logger.error(f"Error checking onboarding status: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error checking onboarding status: {str(e)}"
        )


@router.get("/{clerk_user_id}", response_model=OnboardingResponse)
async def get_onboarding(
    clerk_user_id: str,
    db: Session = Depends(get_db),
):
    """Get user's onboarding data"""
    try:
        logger.info(f"Fetching onboarding data for user: {clerk_user_id}")
        user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()

        if not user:
            logger.warning(f"User not found: {clerk_user_id}")
            raise HTTPException(status_code=404, detail="User not found")

        onboarding = db.query(Onboarding).filter(Onboarding.user_id == user.id).first()

        if not onboarding:
            logger.warning(f"Onboarding data not found for user: {clerk_user_id}")
            raise HTTPException(status_code=404, detail="Onboarding data not found")

        logger.info(f"Onboarding data found for user: {clerk_user_id}")
        return onboarding

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching onboarding data: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching onboarding data: {str(e)}"
        )
