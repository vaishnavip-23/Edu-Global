from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class OnboardingRequest(BaseModel):
    education_level: Optional[str] = None
    degree_major: Optional[str] = None
    graduation_year: Optional[str] = None
    gpa: Optional[str] = None
    target_degree: Optional[str] = None
    field_of_study: Optional[str] = None
    target_intake_year: Optional[str] = None
    preferred_countries: Optional[str] = None
    budget_range: Optional[str] = None
    funding_plan: Optional[str] = None
    ielts_status: Optional[str] = None
    toefl_status: Optional[str] = None
    gre_status: Optional[str] = None
    gmat_status: Optional[str] = None
    sop_status: Optional[str] = None
    is_final_submit: bool = False


class OnboardingResponse(BaseModel):
    id: int
    user_id: int
    education_level: Optional[str] = None
    degree_major: Optional[str] = None
    graduation_year: Optional[int] = None
    gpa: Optional[str] = None
    target_degree: Optional[str] = None
    field_of_study: Optional[str] = None
    target_intake_year: Optional[int] = None
    preferred_countries: Optional[str] = None
    budget_range: Optional[str] = None
    funding_plan: Optional[str] = None
    ielts_status: Optional[str] = None
    toefl_status: Optional[str] = None
    gre_status: Optional[str] = None
    gmat_status: Optional[str] = None
    sop_status: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    id: int
    clerk_user_id: str
    email: str
    onboarding_complete: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
