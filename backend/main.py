from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import FRONTEND_URL
from backend.routes import onboarding
from backend.database import Base, engine

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="StudyAbroad AI API",
    description="Backend API for StudyAbroad AI counsellor",
    version="0.1.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(onboarding.router)


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.get("/api/test-db")
async def test_database():
    """Test database connection and tables"""
    from sqlalchemy import inspect
    from backend.database import engine, SessionLocal
    from backend.models import User, Onboarding

    try:
        # Test connection
        with engine.connect() as conn:
            conn.execute("SELECT 1")

        # Check if tables exist
        inspector = inspect(engine)
        tables = inspector.get_table_names()

        # Test query
        db = SessionLocal()
        user_count = db.query(User).count()
        onboarding_count = db.query(Onboarding).count()
        db.close()

        return {
            "status": "ok",
            "database_connected": True,
            "tables": tables,
            "user_count": user_count,
            "onboarding_count": onboarding_count,
            "database_url": engine.url.database
        }

    except Exception as e:
        return {
            "status": "error",
            "database_connected": False,
            "error": str(e)
        }
