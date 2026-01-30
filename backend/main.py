from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from config import FRONTEND_URL
from routes import onboarding
from routes import universities
from routes import ai_counsellor
from routes import todos
from routes import users
from database import Base, engine
import logging

logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="StudyAbroad AI API",
    description="Backend API for StudyAbroad AI counsellor",
    version="0.1.0",
)

# CORS middleware - add FIRST, before other middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom exception handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    logger.error(f"Validation error on {request.method} {request.url.path}")
    logger.error(f"Validation errors: {errors}")

    # Log the request body for debugging
    try:
        body = await request.body()
        logger.error(f"Request body: {body.decode('utf-8')[:500]}")
    except:
        pass

    # Format errors to be JSON serializable
    formatted_errors = []
    for error in errors:
        formatted_errors.append({
            "loc": error.get("loc"),
            "msg": error.get("msg"),
            "type": error.get("type"),
        })

    return JSONResponse(
        status_code=422,
        content={"detail": formatted_errors}
    )

# Routes
app.include_router(onboarding.router)
app.include_router(universities.router)
app.include_router(ai_counsellor.router)
app.include_router(todos.router)
app.include_router(users.router)


@app.get("/health")
@app.head("/health")
async def health_check():
    return {"status": "ok"}


@app.get("/api/test-db")
async def test_database():
    """Test database connection and tables"""
    from sqlalchemy import inspect
    from database import engine, SessionLocal
    from models import User, Onboarding

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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
