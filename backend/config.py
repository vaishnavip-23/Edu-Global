import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from backend directory
backend_dir = Path(__file__).parent
env_path = backend_dir / ".env"
load_dotenv(env_path)

# Also try loading from project root as fallback
root_dir = backend_dir.parent
root_env_path = root_dir / ".env"
if root_env_path.exists():
    load_dotenv(root_env_path)

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://user:password@localhost:5432/hackathon"
)
CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
