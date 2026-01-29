from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, DECIMAL, Text, Float, Date
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    clerk_user_id = Column(String(255), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    onboarding_complete = Column(Boolean, default=False)
    current_stage = Column(Integer, default=1)  # 1: Building Profile, 2: Discovering, 3: Finalizing, 4: Preparing
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    onboarding = relationship("Onboarding", back_populates="user", uselist=False)
    todos = relationship("Todo", back_populates="user", cascade="all, delete-orphan")


class Onboarding(Base):
    __tablename__ = "onboarding"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False, index=True)

    # Academic Background
    education_level = Column(String(100))
    degree_major = Column(String(255))
    graduation_year = Column(Integer)
    gpa = Column(String(100))

    # Study Goal
    target_degree = Column(String(100))
    field_of_study = Column(String(255))
    target_intake_year = Column(Integer)
    preferred_countries = Column(Text)  # JSON string or comma-separated

    # Budget
    budget_range = Column(String(100))
    funding_plan = Column(String(100))

    # Exams & Readiness
    ielts_status = Column(String(50))
    toefl_status = Column(String(50))
    gre_status = Column(String(50))
    gmat_status = Column(String(50))
    sop_status = Column(String(50))

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="onboarding")


class Shortlist(Base):
    __tablename__ = "shortlist"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    university_id = Column(String(50), nullable=False)  # e.g., "UNI-001"
    category = Column(String(50))  # Dream, Target, Safe
    locked = Column(Boolean, default=False)
    match_score = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Composite unique constraint: one user can't shortlist same university twice
    __table_args__ = (
        {'extend_existing': True}
    )


class Todo(Base):
    __tablename__ = "todos"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    status = Column(String(50), default="pending")  # pending, in_progress, completed
    priority = Column(String(50), default="medium")  # low, medium, high
    category = Column(String(100))  # exam, document, application, etc.
    university_id = Column(String(50))  # Optional: if task is university-specific
    stage = Column(Integer)  # Which stage this task belongs to (1-4)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="todos")


class University(Base):
    __tablename__ = "universities"

    id = Column(Integer, primary_key=True, index=True)
    
    # Basic Information
    name = Column(String(255), nullable=False, index=True)
    country = Column(String(100), nullable=False, index=True)
    state = Column(String(100))
    city = Column(String(100))
    website = Column(String(500))
    
    # Academic Metrics
    qs_ranking = Column(Integer)  # QS World Ranking
    us_news_ranking = Column(Integer)  # US News Ranking
    acceptance_rate = Column(Float)  # Percentage 0-100
    
    # Entrance Exam Requirements
    minimum_gpa = Column(Float)
    gmat_required = Column(Boolean, default=False)
    gmat_average_score = Column(Integer)
    gre_required = Column(Boolean, default=False)
    gre_average_score = Column(Integer)
    toefl_required = Column(Boolean, default=False)
    toefl_minimum_score = Column(Integer)
    ielts_required = Column(Boolean, default=False)
    ielts_minimum_score = Column(Float)
    
    # Financial Information
    tuition_per_year = Column(DECIMAL(12, 2))  # USD
    living_expenses_per_year = Column(DECIMAL(12, 2))  # USD
    application_fee = Column(DECIMAL(8, 2))  # USD
    scholarship_available = Column(Boolean, default=False)
    average_scholarship_percentage = Column(Float)  # Percentage 0-100
    
    # Programs & Degrees
    offers_masters = Column(Boolean, default=True)
    offers_phd = Column(Boolean, default=False)
    popular_fields = Column(Text)  # JSON or comma-separated
    
    # Application Deadlines
    fall_application_deadline = Column(Date)
    spring_application_deadline = Column(Date)
    fall_semester_start = Column(Date)
    spring_semester_start = Column(Date)
    
    # Additional Information
    campus_size = Column(String(50))  # e.g., "Large", "Medium", "Small"
    location_type = Column(String(50))  # e.g., "Urban", "Suburban", "Rural"
    international_student_percentage = Column(Float)
    on_campus_housing_available = Column(Boolean, default=True)
    notes = Column(Text)  # Additional notes or description
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
