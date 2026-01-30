from pydantic import BaseModel, field_validator
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

    # Exam Scores
    ielts_score: Optional[float] = None
    toefl_score: Optional[int] = None
    gre_quant_score: Optional[int] = None
    gre_verbal_score: Optional[int] = None
    gre_awa_score: Optional[float] = None
    gmat_score: Optional[int] = None
    
    @field_validator('gpa')
    @classmethod
    def validate_gpa(cls, v):
        if v is None:
            return v
        # Convert empty strings to None
        if isinstance(v, str) and len(v.strip()) == 0:
            return None
        # Accept any GPA format (numeric, percentage, range, etc.)
        # Just validate it's not too long
        if len(str(v)) > 100:
            raise ValueError("GPA value too long")
        return v
    
    @field_validator('graduation_year')
    @classmethod
    def validate_graduation_year(cls, v):
        if v is None:
            return v
        try:
            year = int(v)
            if year < 1900 or year > 2100:
                raise ValueError("Graduation year must be between 1900 and 2100")
            return v
        except (ValueError, TypeError):
            raise ValueError("Graduation year must be a valid year")
    
    @field_validator('preferred_countries', 'education_level', 'degree_major', 'field_of_study', 'target_degree', 'budget_range', 'funding_plan')
    @classmethod
    def validate_string_length(cls, v):
        if v is None:
            return v
        # Convert empty strings to None
        if isinstance(v, str) and len(v.strip()) == 0:
            return None
        if len(str(v)) > 500:
            raise ValueError("Field value too long (max 500 chars)")
        return v

    @field_validator('ielts_score')
    @classmethod
    def validate_ielts(cls, v):
        if v is not None and (v < 0 or v > 9):
            raise ValueError("IELTS score must be between 0 and 9")
        return v

    @field_validator('toefl_score')
    @classmethod
    def validate_toefl(cls, v):
        if v is not None and (v < 0 or v > 120):
            raise ValueError("TOEFL score must be between 0 and 120")
        return v

    @field_validator('gre_quant_score')
    @classmethod
    def validate_gre_quant(cls, v):
        if v is not None and (v < 130 or v > 170):
            raise ValueError("GRE Quantitative score must be between 130 and 170")
        return v

    @field_validator('gre_verbal_score')
    @classmethod
    def validate_gre_verbal(cls, v):
        if v is not None and (v < 130 or v > 170):
            raise ValueError("GRE Verbal score must be between 130 and 170")
        return v

    @field_validator('gre_awa_score')
    @classmethod
    def validate_gre_awa(cls, v):
        if v is not None and (v < 0 or v > 6):
            raise ValueError("GRE AWA score must be between 0 and 6")
        return v

    @field_validator('gmat_score')
    @classmethod
    def validate_gmat(cls, v):
        if v is not None and (v < 200 or v > 800):
            raise ValueError("GMAT score must be between 200 and 800")
        return v


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

    # Exam Scores
    ielts_score: Optional[float] = None
    toefl_score: Optional[int] = None
    gre_quant_score: Optional[int] = None
    gre_verbal_score: Optional[int] = None
    gre_awa_score: Optional[float] = None
    gmat_score: Optional[int] = None

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
