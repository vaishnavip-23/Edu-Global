from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from backend.database import get_db
from backend.models import User, Onboarding, Todo
from backend.schemas import OnboardingRequest, OnboardingResponse
from backend.auth import get_current_user
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/onboarding", tags=["onboarding"])


def generate_initial_todos(user: User, onboarding: Onboarding, db: Session):
    """Generate AI-powered initial todos based on onboarding profile"""
    try:
        # Stage 2 (Discovering Universities) todos
        stage_2_todos = [
            {
                "title": "Explore universities matching your profile",
                "description": f"Review the AI counsellor's recommended universities based on your {onboarding.target_degree} in {onboarding.field_of_study} goals and {onboarding.budget_range} budget.",
                "priority": "high",
                "category": "discovery",
            },
            {
                "title": "Shortlist 5-8 universities",
                "description": "Use the AI counsellor to understand why each university is a good fit. Aim to shortlist universities in Dream, Target, and Safe categories.",
                "priority": "high",
                "category": "discovery",
            },
        ]

        # Exam readiness todos based on status
        exam_todos = []
        if onboarding.ielts_status in ["Not started", "Planning"]:
            exam_todos.append({
                "title": "Prepare for IELTS or TOEFL",
                "description": "Start preparing for English proficiency exams. Most universities require IELTS 6.5+ or TOEFL 90+. Consider taking practice tests.",
                "priority": "high",
                "category": "exams",
            })
        
        if onboarding.gre_status in ["Not started", "Planning"]:
            if onboarding.target_degree in ["Masters", "PhD", "MS", "MSc"]:
                exam_todos.append({
                    "title": "Prepare for GRE (if required)",
                    "description": "Check if your target universities require GRE. Start with diagnostic test to understand your baseline.",
                    "priority": "medium",
                    "category": "exams",
                })
        
        if onboarding.gmat_status in ["Not started", "Planning"]:
            if onboarding.target_degree in ["MBA", "Masters"]:
                exam_todos.append({
                    "title": "Prepare for GMAT (if required)",
                    "description": "If pursuing an MBA, check GMAT requirements and start preparation early.",
                    "priority": "medium",
                    "category": "exams",
                })

        # Document preparation todos
        doc_todos = []
        if onboarding.sop_status in ["Not started", "Planning"]:
            doc_todos.append({
                "title": "Start drafting your Statement of Purpose (SOP)",
                "description": "Begin thinking about why you want to pursue this degree, your career goals, and why specific universities align with your aspirations.",
                "priority": "medium",
                "category": "documents",
            })

        doc_todos.extend([
            {
                "title": "Prepare academic documents",
                "description": "Collect official transcripts, diplomas, and degree certificates from your previous education.",
                "priority": "medium",
                "category": "documents",
            },
            {
                "title": "Identify recommenders for LORs",
                "description": "Think about professors, mentors, or employers who can write strong letters of recommendation. You'll typically need 2-3 LORs.",
                "priority": "medium",
                "category": "documents",
            },
        ])

        # Combine all todos
        all_todos = stage_2_todos + exam_todos + doc_todos

        # Create todos in database
        for todo_data in all_todos:
            todo = Todo(
                user_id=user.id,
                title=todo_data["title"],
                description=todo_data["description"],
                priority=todo_data["priority"],
                category=todo_data["category"],
                stage=2,  # Stage 2 todos
                status="pending",
            )
            db.add(todo)

        db.commit()
        logger.info(f"Generated {len(all_todos)} initial todos for user: {user.clerk_user_id}")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error generating initial todos: {str(e)}")


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
    logger.info(f"Received onboarding submission from user: {current_user.get('clerk_user_id')}")
    logger.info(f"Data received: clerk_user_id={data.clerk_user_id}, email={data.email}")

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

        # Add exam scores
        onboarding.ielts_score = data.ielts_score
        onboarding.toefl_score = data.toefl_score
        onboarding.gre_quant_score = data.gre_quant_score
        onboarding.gre_verbal_score = data.gre_verbal_score
        onboarding.gre_awa_score = data.gre_awa_score
        onboarding.gmat_score = data.gmat_score

        db.add(onboarding)

        # Mark user as onboarding complete only on final submit; advance to stage 2
        if data.is_final_submit:
            logger.info(f"Marking onboarding as complete for user: {clerk_user_id}")
            user.onboarding_complete = True
            user.current_stage = 2  # Auto-advance to Stage 2: Discovering Universities
            db.add(user)

        db.commit()
        db.refresh(onboarding)

        # Generate initial AI-powered todos if onboarding is complete
        if data.is_final_submit:
            logger.info(f"Generating initial todos for user: {clerk_user_id}")
            generate_initial_todos(user, onboarding, db)

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
    """Check if user has completed onboarding - public endpoint"""

    try:
        logger.info(f"Checking onboarding status for user: {clerk_user_id}")
        user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()

        if not user:
            logger.info(f"User not found: {clerk_user_id}")
            return {"onboarding_complete": False}

        logger.info(f"User found. Onboarding complete: {user.onboarding_complete}")
        return {"onboarding_complete": user.onboarding_complete}

    except HTTPException:
        raise
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
    current_user: dict = Depends(get_current_user),
):
    """Get user's onboarding data"""
    # Verify user can only access their own data
    if clerk_user_id != current_user["clerk_user_id"]:
        raise HTTPException(
            status_code=403,
            detail="Cannot access another user's onboarding data"
        )

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


@router.patch("/update/{clerk_user_id}", response_model=OnboardingResponse)
async def update_onboarding(
    clerk_user_id: str,
    data: OnboardingRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Update user's onboarding profile (after initial completion)"""
    # Verify user can only update their own profile
    if clerk_user_id != current_user["clerk_user_id"]:
        raise HTTPException(
            status_code=403,
            detail="Cannot update another user's profile"
        )
    
    logger.info(f"Updating onboarding for user: {clerk_user_id}")
    
    try:
        user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        onboarding = db.query(Onboarding).filter(Onboarding.user_id == user.id).first()
        if not onboarding:
            raise HTTPException(status_code=404, detail="Onboarding data not found")
        
        # Update only provided fields
        if data.education_level is not None:
            onboarding.education_level = data.education_level
        if data.degree_major is not None:
            onboarding.degree_major = data.degree_major
        if data.graduation_year is not None:
            try:
                onboarding.graduation_year = int(data.graduation_year)
            except (ValueError, TypeError):
                onboarding.graduation_year = None
        if data.gpa is not None:
            onboarding.gpa = data.gpa
        if data.target_degree is not None:
            onboarding.target_degree = data.target_degree
        if data.field_of_study is not None:
            onboarding.field_of_study = data.field_of_study
        if data.target_intake_year is not None:
            try:
                onboarding.target_intake_year = int(data.target_intake_year.split()[-1])
            except (ValueError, IndexError, AttributeError):
                onboarding.target_intake_year = None
        if data.preferred_countries is not None:
            onboarding.preferred_countries = data.preferred_countries
        if data.budget_range is not None:
            onboarding.budget_range = data.budget_range
        if data.funding_plan is not None:
            onboarding.funding_plan = data.funding_plan
        if data.ielts_status is not None:
            onboarding.ielts_status = data.ielts_status
        if data.toefl_status is not None:
            onboarding.toefl_status = data.toefl_status
        if data.gre_status is not None:
            onboarding.gre_status = data.gre_status
        if data.gmat_status is not None:
            onboarding.gmat_status = data.gmat_status
        if data.sop_status is not None:
            onboarding.sop_status = data.sop_status

        # Update exam scores
        if data.ielts_score is not None:
            onboarding.ielts_score = data.ielts_score
        if data.toefl_score is not None:
            onboarding.toefl_score = data.toefl_score
        if data.gre_quant_score is not None:
            onboarding.gre_quant_score = data.gre_quant_score
        if data.gre_verbal_score is not None:
            onboarding.gre_verbal_score = data.gre_verbal_score
        if data.gre_awa_score is not None:
            onboarding.gre_awa_score = data.gre_awa_score
        if data.gmat_score is not None:
            onboarding.gmat_score = data.gmat_score

        db.commit()
        db.refresh(onboarding)
        
        logger.info(f"Profile updated successfully for user: {clerk_user_id}")
        return onboarding
    
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error updating profile: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating profile: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating profile: {str(e)}")
