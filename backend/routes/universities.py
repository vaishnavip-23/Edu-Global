from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.database import get_db
from backend.models import User, Onboarding, Shortlist, Todo
from backend.services.university_service import university_service
from backend.auth import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/universities", tags=["universities"])


class ShortlistRequest(BaseModel):
    """Request body for adding to shortlist"""
    match_score: Optional[int] = 0
    category: Optional[str] = "Target"


@router.get("/all")
async def get_all_universities():
    """Get all universities (no filtering)"""
    try:
        universities = university_service.get_all_universities()
        return {
            "status": "success",
            "count": len(universities),
            "universities": universities
        }
    except Exception as e:
        logger.error(f"Error fetching universities: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recommended")
async def get_recommended_universities(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Get recommended universities based on user's onboarding profile
    Returns universities categorized as Dream/Target/Safe
    """
    try:
        clerk_user_id = current_user["clerk_user_id"]

        # Get user from database
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
        if not onboarding:
            raise HTTPException(
                status_code=404,
                detail="Please complete onboarding first"
            )

        # Parse user data
        preferred_countries = []
        if onboarding.preferred_countries:
            preferred_countries = [
                c.strip()
                for c in onboarding.preferred_countries.split(",")
            ]

        # Parse budget
        budget_max = None
        if onboarding.budget_range:
            # Extract max from range like "$40,000 - $60,000"
            try:
                budget_str = onboarding.budget_range.split("-")[-1].strip()
                budget_max = float(budget_str.replace("$", "").replace(",", ""))
            except (ValueError, AttributeError, IndexError) as e:
                logger.warning(f"Could not parse budget range: {onboarding.budget_range}, error: {e}")
                budget_max = None

        # Parse GPA - handle string ranges like "Above 3.7 / 90%+"
        user_gpa = None
        if onboarding.gpa and onboarding.gpa != "Not Applicable":
            try:
                # Try to extract numeric value from string
                if isinstance(onboarding.gpa, str):
                    # Handle ranges like "Above 3.7 / 90%+" or "3.5 - 3.7 / 85-90%"
                    import re
                    numbers = re.findall(r'\d+\.?\d*', onboarding.gpa)
                    if numbers:
                        # Take the first number as representative GPA
                        user_gpa = float(numbers[0])
                else:
                    user_gpa = float(onboarding.gpa)
            except (ValueError, TypeError, AttributeError) as e:
                logger.warning(f"Could not parse GPA: {onboarding.gpa}, error: {e}")
                user_gpa = None

        # Extract exam scores from onboarding
        user_gre = None
        user_gmat = None
        user_ielts = None
        user_toefl = None

        # GRE: Calculate combined score if both sections available
        if onboarding.gre_quant_score and onboarding.gre_verbal_score:
            user_gre = onboarding.gre_quant_score + onboarding.gre_verbal_score

        if onboarding.gmat_score:
            user_gmat = onboarding.gmat_score

        if onboarding.ielts_score:
            user_ielts = onboarding.ielts_score

        if onboarding.toefl_score:
            user_toefl = onboarding.toefl_score

        # Get recommendations
        recommendations = university_service.get_recommended_universities(
            target_degree=onboarding.target_degree,
            field_of_study=onboarding.field_of_study,
            preferred_countries=preferred_countries,
            budget_max=budget_max,
            target_intake_year=onboarding.target_intake_year,
            user_gpa=user_gpa,
            user_gre=user_gre,
            user_gmat=user_gmat,
            user_ielts=user_ielts,
            user_toefl=user_toefl,
        )

        # Get user's shortlisted universities
        shortlisted = db.query(Shortlist).filter(Shortlist.user_id == user.id).all()
        shortlisted_ids = {s.university_id for s in shortlisted}
        locked_ids = {s.university_id for s in shortlisted if s.locked}

        # Add shortlist status to each university
        for category in ["dream", "target", "safe", "all"]:
            for uni in recommendations[category]:
                uni["is_shortlisted"] = uni["university_id"] in shortlisted_ids
                uni["is_locked"] = uni["university_id"] in locked_ids

        return {
            "status": "success",
            "recommendations": recommendations,
            "total_count": len(recommendations["all"]),
            "dream_count": len(recommendations["dream"]),
            "target_count": len(recommendations["target"]),
            "safe_count": len(recommendations["safe"]),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{university_id}")
async def get_university_details(
    university_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get detailed information about a specific university"""
    try:
        university = university_service.get_university_by_id(university_id)
        if not university:
            raise HTTPException(status_code=404, detail="University not found")

        # Check if user has shortlisted this university
        clerk_user_id = current_user["clerk_user_id"]
        user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()

        if user:
            shortlist = db.query(Shortlist).filter(
                Shortlist.user_id == user.id,
                Shortlist.university_id == university_id
            ).first()

            university["is_shortlisted"] = shortlist is not None
            university["is_locked"] = shortlist.locked if shortlist else False
        else:
            university["is_shortlisted"] = False
            university["is_locked"] = False

        return {
            "status": "success",
            "university": university
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching university details: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/shortlist/{university_id}")
async def add_to_shortlist(
    university_id: str,
    request: ShortlistRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Add a university to user's shortlist"""
    try:
        clerk_user_id = current_user["clerk_user_id"]

        # Get user
        user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Check if university exists
        university = university_service.get_university_by_id(university_id)
        if not university:
            raise HTTPException(status_code=404, detail="University not found")

        # Check if already shortlisted
        existing = db.query(Shortlist).filter(
            Shortlist.user_id == user.id,
            Shortlist.university_id == university_id
        ).first()

        if existing:
            return {
                "status": "success",
                "message": "University already in shortlist",
                "shortlist_id": existing.id
            }

        # Stage progression: first shortlist moves from stage 2 to 3 (Finalizing Universities)
        shortlist_count = db.query(Shortlist).filter(Shortlist.user_id == user.id).count()
        if shortlist_count == 0 and user.current_stage == 2:
            user.current_stage = 3
            db.add(user)

        # Add to shortlist
        # Use match_score and category from request, or fall back to defaults
        match_score = request.match_score if request.match_score is not None else 0
        category = request.category if request.category else university.get("category", "Target")
        
        # Ensure match_score is an integer
        try:
            match_score = int(match_score)
        except (ValueError, TypeError):
            match_score = 0

        shortlist = Shortlist(
            user_id=user.id,
            university_id=university_id,
            category=category,
            match_score=match_score,
            locked=False
        )
        db.add(shortlist)
        db.commit()
        db.refresh(shortlist)

        logger.info(f"User {user.id} shortlisted university {university_id}")

        return {
            "status": "success",
            "message": "University added to shortlist",
            "shortlist_id": shortlist.id
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error adding to shortlist: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/shortlist/{university_id}")
async def remove_from_shortlist(
    university_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Remove a university from user's shortlist"""
    try:
        clerk_user_id = current_user["clerk_user_id"]

        # Get user
        user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Find shortlist entry
        shortlist = db.query(Shortlist).filter(
            Shortlist.user_id == user.id,
            Shortlist.university_id == university_id
        ).first()

        if not shortlist:
            raise HTTPException(
                status_code=404,
                detail="University not in shortlist"
            )

        # Don't allow removing locked universities
        if shortlist.locked:
            raise HTTPException(
                status_code=400,
                detail="Cannot remove locked university. Unlock it first."
            )

        db.delete(shortlist)
        db.commit()

        logger.info(f"User {user.id} removed university {university_id} from shortlist")

        return {
            "status": "success",
            "message": "University removed from shortlist"
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error removing from shortlist: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/shortlist/my-shortlist")
async def get_my_shortlist(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get user's shortlisted universities"""
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

        # Get shortlist
        shortlist_entries = db.query(Shortlist).filter(
            Shortlist.user_id == user.id
        ).all()

        # Fetch full university data for each shortlisted item
        shortlisted_universities = []
        for entry in shortlist_entries:
            uni = university_service.get_university_by_id(entry.university_id)
            if uni:
                uni["is_shortlisted"] = True
                uni["is_locked"] = entry.locked
                uni["shortlist_id"] = entry.id
                uni["shortlisted_at"] = entry.created_at.isoformat()
                # Preserve match_score and category from Shortlist table
                if entry.match_score is not None:
                    uni["match_score"] = entry.match_score
                if entry.category:
                    uni["category"] = entry.category
                shortlisted_universities.append(uni)

        return {
            "status": "success",
            "count": len(shortlisted_universities),
            "shortlist": shortlisted_universities
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching shortlist: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/lock/{university_id}")
async def lock_university(
    university_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Lock a shortlisted university (commitment step)"""
    try:
        clerk_user_id = current_user["clerk_user_id"]

        # Get user
        user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Find shortlist entry
        shortlist = db.query(Shortlist).filter(
            Shortlist.user_id == user.id,
            Shortlist.university_id == university_id
        ).first()

        if not shortlist:
            raise HTTPException(
                status_code=404,
                detail="University must be shortlisted before locking"
            )

        # Lock it
        shortlist.locked = True
        # Stage progression: first lock moves to stage 4 (Preparing Applications)
        if user.current_stage < 4:
            user.current_stage = 4
            db.add(user)

        # Auto-generate application todos for this university
        university = university_service.get_university_by_id(university_id)
        uni_name = university.get("university_name") if university else university_id

        existing_todos = db.query(Todo).filter(
            Todo.user_id == user.id,
            Todo.university_id == university_id
        ).count()

        tasks_created = 0
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

            tasks_created = len(todos_to_create)

        db.commit()

        logger.info(f"User {user.id} locked university {university_id}. {tasks_created} tasks created.")

        return {
            "status": "success",
            "message": f"University locked successfully. {tasks_created} application tasks created.",
            "tasks_created": tasks_created
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error locking university: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/unlock/{university_id}")
async def unlock_university(
    university_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Unlock a locked university"""
    try:
        clerk_user_id = current_user["clerk_user_id"]

        # Get user
        user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Find shortlist entry
        shortlist = db.query(Shortlist).filter(
            Shortlist.user_id == user.id,
            Shortlist.university_id == university_id
        ).first()

        if not shortlist:
            raise HTTPException(status_code=404, detail="University not found in shortlist")

        # Unlock it
        shortlist.locked = False
        db.commit()

        logger.info(f"User {user.id} unlocked university {university_id}")

        return {
            "status": "success",
            "message": "University unlocked"
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error unlocking university: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
