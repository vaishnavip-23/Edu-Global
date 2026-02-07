# EduGlobal
AI-powered study-abroad counselling platform that guides students from profile setup to university commitment and application preparation.

## What This Project Does
EduGlobal provides a stage-based student journey:
1. Build profile (onboarding)
2. Discover universities (personalized matching)
3. Finalize choices (shortlist + lock)
4. Prepare applications (auto-generated tasks)

It combines a FastAPI backend, Next.js frontend, Clerk authentication, and Gemini-based AI action tools.

## Core Features
- AI counsellor with **real actions** (shortlist/lock/unlock universities, create/delete todos)
- Structured 4-step onboarding (academics, goals, budget, exams)
- University recommendation engine with Dream/Target/Safe classification
- Match scoring with fit reasons + risk factors
- Stage progression logic tied to user actions
- Application prep workflow unlocked after university lock

## Tech Stack
- Frontend: Next.js (App Router), React, Tailwind CSS, Clerk
- Backend: FastAPI, SQLAlchemy, Pydantic
- AI: Google Gemini (tool calling)
- Data: JSON university dataset (`backend/data/universities.json`)
- DB: PostgreSQL (recommended)

## Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL
- Clerk credentials
- Gemini API key

## Environment Setup
Create `.env` at project root (copy from `.env.example`):

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL`
- `CLERK_SECRET_KEY`
- `GEMINI_API_KEY`
- `FRONTEND_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_API_URL`

Create `frontend/.env.local` with:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_API_URL`
- optional `CLERK_SECRET_KEY`

## Quick Start
### 1. Run Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```
Backend runs at `http://localhost:8000`.

### 2. Run Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:3000`.

## Recommendation Logic (High Level)
University match score is normalized to 0-100 using weighted components:
- GPA match
- Exam readiness
- Budget fit
- Country preference
- Ranking tier

Then each university is categorized as Dream/Target/Safe with additional selectivity rules.

## AI Counsellor Capabilities
AI can call backend tools to:
- get profile and recommendations
- shortlist/remove universities
- lock/unlock universities
- create/delete tasks
- retrieve todos and shortlist state

## Build & Validation
Run frontend checks:
```bash
cd frontend
npm run lint
npm run build -- --webpack
```

Run backend syntax check:
```bash
python3 -m py_compile backend/*.py backend/routes/*.py backend/services/*.py
```

## Deployment Notes
- Use production PostgreSQL
- Set all required env vars in deployment platform
- Set `NEXT_PUBLIC_API_URL` to deployed backend URL
- Build frontend with webpack mode in restricted environments:
  - `npm run build -- --webpack`

## License
MIT License. See `LICENSE` for details.

## Demo Video
[Watch the full demo video](https://app.weet.co/play/fd457ab1/ai-counsellor-hackathon)

## Hackathon Result
Recognized with a **Certificate** in the **AI Counsellor Hackathon** conducted by Humanity Founders.

