from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, DECIMAL, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    clerk_user_id = Column(String(255), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    onboarding_complete = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    onboarding = relationship("Onboarding", back_populates="user", uselist=False)


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
