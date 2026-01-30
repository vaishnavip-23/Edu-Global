-- Users table (linked to Clerk)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Onboarding Data
CREATE TABLE onboarding (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Academic Background
  education_level VARCHAR(100),
  degree_major VARCHAR(255),
  graduation_year INTEGER,
  gpa VARCHAR(100),
  
  -- Study Goal
  target_degree VARCHAR(100),
  field_of_study VARCHAR(255),
  target_intake_year INTEGER,
  preferred_countries TEXT,
  
  -- Budget
  budget_range VARCHAR(100),
  funding_plan VARCHAR(100),
  
  -- Exams & Readiness
  ielts_status VARCHAR(50),
  toefl_status VARCHAR(50),
  gre_status VARCHAR(50),
  gmat_status VARCHAR(50),
  sop_status VARCHAR(50),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_clerk_id ON users(clerk_user_id);
CREATE INDEX idx_onboarding_user_id ON onboarding(user_id);
