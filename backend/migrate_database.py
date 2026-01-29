"""
Database migration script to fix the GPA column type issue.
This script will drop and recreate all tables with the correct schema.
"""

import sys
from pathlib import Path

# Add parent directory to path to allow imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.database import engine, Base
from backend.models import User, Onboarding

def migrate():
    print("Starting database migration...")
    print("This will drop all existing tables and recreate them with correct schema.")
    print()

    try:
        # Drop all tables
        print("Dropping all tables...")
        Base.metadata.drop_all(bind=engine)
        print("✓ Tables dropped successfully.")

        # Create all tables with correct schema
        print("\nCreating tables with correct schema...")
        Base.metadata.create_all(bind=engine)
        print("✓ Tables created successfully.")

        print("\n" + "="*50)
        print("Migration completed successfully!")
        print("="*50)
        print("\nThe database schema is now up to date.")
        print("GPA column is now VARCHAR(100) and can accept text values.")

    except Exception as e:
        print(f"\n✗ Error during migration: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    migrate()
