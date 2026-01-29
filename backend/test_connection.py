"""
Database Connection Test Script
Run this to verify your Neon DB connection is working
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.database import engine, SessionLocal
from backend.models import User, Onboarding, Base
from backend.config import DATABASE_URL
from sqlalchemy import inspect, text


def test_connection():
    """Test database connection and setup"""
    print("="*60)
    print("DATABASE CONNECTION TEST")
    print("="*60)
    print()

    # Step 1: Check environment variables
    print("1. Checking environment variables...")
    if not DATABASE_URL:
        print("❌ DATABASE_URL not found in environment")
        print("   Please check your .env file")
        return False

    print(f"✅ DATABASE_URL found")
    # Mask password in output
    safe_url = DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else DATABASE_URL
    print(f"   Database: {safe_url}")
    print()

    # Step 2: Test connection
    print("2. Testing database connection...")
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version();"))
            version = result.fetchone()[0]
            print("✅ Successfully connected to database")
            print(f"   PostgreSQL version: {version.split(',')[0]}")
    except Exception as e:
        print(f"❌ Failed to connect to database")
        print(f"   Error: {str(e)}")
        print()
        print("Common fixes:")
        print("  - Check your DATABASE_URL is correct")
        print("  - Verify your Neon project is active")
        print("  - Ensure 'sslmode=require' is in the connection string")
        return False
    print()

    # Step 3: Check tables
    print("3. Checking database tables...")
    try:
        inspector = inspect(engine)
        tables = inspector.get_table_names()

        if not tables:
            print("⚠️  No tables found. Creating tables...")
            Base.metadata.create_all(bind=engine)
            tables = inspector.get_table_names()
            print("✅ Tables created successfully")
        else:
            print("✅ Tables found:")

        for table in tables:
            columns = inspector.get_columns(table)
            print(f"   - {table} ({len(columns)} columns)")

    except Exception as e:
        print(f"❌ Error checking tables: {str(e)}")
        return False
    print()

    # Step 4: Test queries
    print("4. Testing database queries...")
    try:
        db = SessionLocal()

        # Count users
        user_count = db.query(User).count()
        print(f"✅ Users table accessible: {user_count} users found")

        # Count onboarding records
        onboarding_count = db.query(Onboarding).count()
        print(f"✅ Onboarding table accessible: {onboarding_count} records found")

        db.close()

    except Exception as e:
        print(f"❌ Error querying database: {str(e)}")
        return False
    print()

    # Step 5: Test write operation
    print("5. Testing write operation...")
    try:
        db = SessionLocal()

        # Try to create and rollback a test user
        test_user = User(
            clerk_user_id="test_connection_user_id",
            email="test@example.com"
        )
        db.add(test_user)
        db.flush()  # Test the insert without committing
        db.rollback()  # Roll back the test

        print("✅ Write operations working correctly")
        db.close()

    except Exception as e:
        print(f"❌ Error testing write operation: {str(e)}")
        db.rollback()
        db.close()
        return False
    print()

    # Success!
    print("="*60)
    print("✅ ALL TESTS PASSED!")
    print("="*60)
    print()
    print("Your database is configured correctly!")
    print("You can now start the backend server:")
    print("  uvicorn backend.main:app --reload --port 8000")
    print()
    return True


if __name__ == "__main__":
    success = test_connection()
    sys.exit(0 if success else 1)
