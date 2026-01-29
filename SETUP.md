# Setup Guide

## Prerequisites

- Python 3.13+
- Node.js 18+
- PostgreSQL (or Neon DB account)
- Clerk account with API keys

## 1. Database Setup

### Option A: Neon DB (Recommended)
1. Sign up at https://neon.tech
2. Create a new project
3. Copy the connection string
4. Save it as `DATABASE_URL` in `.env`

### Option B: Local PostgreSQL
```bash
createdb study_abroad_db
psql study_abroad_db < db/schema.sql
```

## 2. Environment Variables

Copy `.env.example` and create `.env` files:

**Backend (.env in project root):**
```bash
DATABASE_URL=postgresql://user:password@host:5432/study_abroad_db
CLERK_SECRET_KEY=your_clerk_secret_key_here
FRONTEND_URL=http://localhost:3000
```

**Frontend (frontend/.env.local):**
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 3. Backend Setup

```bash
# Install dependencies
pip install -e .

# Run migrations (creates tables)
python -m backend.main

# Start backend server
uvicorn backend.main:app --reload --port 8000
```

Backend will be at: `http://localhost:8000`

## 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local with environment variables (see step 2 above)

# Run dev server
npm run dev
```

Frontend will be at: `http://localhost:3000`

## 5. Testing Flow

1. Go to http://localhost:3000
2. Click "Get Started"
3. Sign up with Clerk
4. Complete onboarding form (all 4 steps)
5. Should redirect to dashboard (coming next)

## Troubleshooting

**Backend not starting?**
- Check DATABASE_URL is valid
- Run `python -m backend.main` to test connection

**CORS errors?**
- Make sure FRONTEND_URL in .env matches your frontend URL

**Clerk token errors?**
- Verify CLERK_SECRET_KEY is correct
- Check frontend .env.local has NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
