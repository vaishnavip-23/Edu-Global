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
