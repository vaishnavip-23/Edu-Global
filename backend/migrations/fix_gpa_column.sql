-- Fix GPA column type from numeric to VARCHAR
-- This migration changes the gpa column to support text values like "Above 3.7 / 90%+"

ALTER TABLE onboarding
ALTER COLUMN gpa TYPE VARCHAR(100);

-- Verify the change
\d onboarding;
