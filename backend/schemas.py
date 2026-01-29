from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional
from decimal import Decimal


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


class UniversityRequest(BaseModel):
    # Basic Information
    name: str
    country: str
    state: Optional[str] = None
    city: Optional[str] = None
    website: Optional[str] = None
    
    # Academic Metrics
    qs_ranking: Optional[int] = None
    us_news_ranking: Optional[int] = None
    acceptance_rate: Optional[float] = None
    
    # Entrance Exam Requirements
    minimum_gpa: Optional[float] = None
    gmat_required: bool = False
    gmat_average_score: Optional[int] = None
    gre_required: bool = False
    gre_average_score: Optional[int] = None
    toefl_required: bool = False
    toefl_minimum_score: Optional[int] = None
    ielts_required: bool = False
    ielts_minimum_score: Optional[float] = None
    
    # Financial Information
    tuition_per_year: Optional[Decimal] = None
    living_expenses_per_year: Optional[Decimal] = None
    application_fee: Optional[Decimal] = None
    scholarship_available: bool = False
    average_scholarship_percentage: Optional[float] = None
    
    # Programs & Degrees
    offers_masters: bool = True
    offers_phd: bool = False
    popular_fields: Optional[str] = None
    
    # Application Deadlines
    fall_application_deadline: Optional[date] = None
    spring_application_deadline: Optional[date] = None
    fall_semester_start: Optional[date] = None
    spring_semester_start: Optional[date] = None
    
    # Additional Information
    campus_size: Optional[str] = None
    location_type: Optional[str] = None
    international_student_percentage: Optional[float] = None
    on_campus_housing_available: bool = True
    notes: Optional[str] = None


class UniversityResponse(BaseModel):
    id: int
    # Basic Information
    name: str
    country: str
    state: Optional[str] = None
    city: Optional[str] = None
    website: Optional[str] = None
    
    # Academic Metrics
    qs_ranking: Optional[int] = None
    us_news_ranking: Optional[int] = None
    acceptance_rate: Optional[float] = None
    
    # Entrance Exam Requirements
    minimum_gpa: Optional[float] = None
    gmat_required: bool = False
    gmat_average_score: Optional[int] = None
    gre_required: bool = False
    gre_average_score: Optional[int] = None
    toefl_required: bool = False
    toefl_minimum_score: Optional[int] = None
    ielts_required: bool = False
    ielts_minimum_score: Optional[float] = None
    
    # Financial Information
    tuition_per_year: Optional[Decimal] = None
    living_expenses_per_year: Optional[Decimal] = None
    application_fee: Optional[Decimal] = None
    scholarship_available: bool = False
    average_scholarship_percentage: Optional[float] = None
    
    # Programs & Degrees
    offers_masters: bool = True
    offers_phd: bool = False
    popular_fields: Optional[str] = None
    
    # Application Deadlines
    fall_application_deadline: Optional[date] = None
    spring_application_deadline: Optional[date] = None
    fall_semester_start: Optional[date] = None
    spring_semester_start: Optional[date] = None
    
    # Additional Information
    campus_size: Optional[str] = None
    location_type: Optional[str] = None
    international_student_percentage: Optional[float] = None
    on_campus_housing_available: bool = True
    notes: Optional[str] = None
    
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
