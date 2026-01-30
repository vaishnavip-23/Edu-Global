# EduGlobal

**EduGlobal** — Your AI Counsellor for study abroad. A guided, stage-based platform to help students make confident study-abroad decisions, from profile building to university shortlisting and application preparation.

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+
- PostgreSQL (or SQLite for development)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials (Clerk, Gemini API, Database)

# Run database migrations
python -m alembic upgrade head

# Start backend
python main.py
```

Backend runs at: `http://localhost:8000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your Clerk credentials

# Start frontend
npm run dev
```

Frontend runs at: `http://localhost:3000`

## 🏗️ Architecture

### Backend (FastAPI)

- **Authentication**: Clerk JWT validation
- **Database**: PostgreSQL/SQLite with SQLAlchemy ORM
- **AI**: Google Gemini with function calling for AI Counsellor
- **API Structure**:
  - `/api/auth` - Authentication endpoints
  - `/api/onboarding` - User profile management
  - `/api/universities` - University recommendations & shortlisting
  - `/api/ai-counsellor` - AI chat with action capabilities
  - `/api/todos` - Task management
  - `/api/users` - User data & dashboard

### Frontend (Next.js)

- **UI**: Tailwind CSS with custom design system
- **Authentication**: Clerk React components
- **State Management**: React hooks
- **Key Pages**:
  - `/onboarding` - 4-step profile setup with exam scores
  - `/dashboard` - Overview with profile strength & todos
  - `/universities` - Personalized recommendations (Dream/Target/Safe)
  - `/shortlist` - Manage shortlisted universities
  - `/counsellor` - AI chat with action capabilities
  - `/application` - University-specific tasks & guidance

## ✨ Key Features

### 1. Intelligent Onboarding

- 4-step profile building: academics, goals, budget, exam readiness
- Captures exam scores (IELTS, TOEFL, GRE, GMAT)
- Profile strength analysis

### 2. University Matching (50 Universities)

- **0-100 Normalized Scoring Algorithm**:
  - GPA Match: 35%
  - Exam Readiness: 25%
  - Budget Fit: 20%
  - Country Preference: 10%
  - University Ranking: 10%
- Categorization: Dream (80+), Target (55-79), Safe (<55)
- Detailed fit reasons & risk analysis

### 3. AI Counsellor (Gemini)

**Takes Real Actions**:

- ✅ Analyzes profile strengths & gaps
- ✅ Recommends personalized universities
- ✅ Shortlists universities from conversation
- ✅ Locks universities (commitment step)
- ✅ Creates actionable todos
- ✅ Tracks progress & suggests next steps

### 4. Stage-Based Journey

1. **Building Profile** - Complete onboarding
2. **Discovering Universities** - Explore & shortlist
3. **Finalizing Universities** - Lock choices (commitment)
4. **Preparing Applications** - Tasks & documents

### 5. Application Guidance

- Auto-generated todos when university is locked
- University-specific requirements (SOP, LOR, transcripts, exams)
- Progress tracking with completion percentage
- Task management with priorities

### 6. Route Protection

- Onboarding required for all features
- Beautiful modals explaining locked features
- Clear progression path

### 7. University Locking Flow

- Commitment confirmation: "Are you ready to commit?"
- Unlocking warning: Clear consequences explained
- Stage progression & task generation

## 🧪 Testing

### Verify AI Counsellor Actions

```bash
python verify_ai_actions.py
```

### Manual Testing

See `TEST_AI_COUNSELLOR.md` for comprehensive test scenarios covering:

- Profile analysis
- University recommendations
- Shortlisting actions
- University locking
- Todo creation
- Stage progression

## 📊 Database Schema

### Core Models

- **User**: Clerk integration, stage tracking, onboarding status
- **Onboarding**: Complete profile with exam scores
- **Shortlist**: Universities with lock status & match scores
- **Todo**: Tasks with priorities, categories, university association

## 🔑 Environment Variables

### Backend (.env)

```bash
DATABASE_URL=postgresql://user:pass@localhost/dbname
CLERK_SECRET_KEY=your_clerk_secret_key
GEMINI_API_KEY=your_gemini_api_key
```

### Frontend (.env.local)

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🗂️ Project Structure

```
├── backend/
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic (AI, university matching)
│   ├── models.py        # Database models
│   ├── schemas.py       # Pydantic schemas
│   ├── auth.py          # Authentication
│   └── main.py          # FastAPI app
├── frontend/
│   ├── app/
│   │   ├── (auth)/      # Sign-in/sign-up pages
│   │   ├── components/  # Reusable components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── onboarding/  # 4-step onboarding flow
│   │   ├── dashboard/   # Dashboard page
│   │   ├── universities/ # University browser
│   │   ├── shortlist/   # Shortlist management
│   │   ├── counsellor/  # AI chat interface
│   │   └── application/ # Application guidance
│   └── public/          # Static assets
└── universities.json    # 50 universities database

```

## 🎨 Design System

- **Colors**: Orange primary, stone neutrals, category-specific (purple=Dream, blue=Target, green=Safe)
- **Typography**: System fonts, clear hierarchy
- **Components**: Cards, modals, forms with dark mode support
- **Animations**: Fade-in, scale-in, stagger-children

## 📝 Development Notes

### Adding Universities

Edit `universities.json` with this structure:

```json
{
  "id": "u1",
  "name": "University Name",
  "website": "https://...",
  "country": "Country",
  "state": "State",
  "degreesOffered": ["Masters", "PhD"],
  "fields": ["Computer Science", "Data Science"],
  "rankingTier": "Top50",
  "academicRequirements": {
    "gpaMin": 3.0,
    "gpaCompetitive": 3.5
  },
  "examRequirements": { ... },
  "estimatedAnnualCostUSD": { ... }
}
```

### AI Counsellor System Prompt

Located in `backend/services/ai_counsellor_service.py`

- Positioned as experienced counsellor (15+ years)
- Warm, professional, action-oriented tone
- Clear tool usage guidelines

### Database Migrations

```bash
# Create migration
python -m alembic revision --autogenerate -m "description"

# Apply migration
python -m alembic upgrade head

# Rollback
python -m alembic downgrade -1
```

## 🐛 Troubleshooting

### Backend won't start

- Check DATABASE_URL is correct
- Verify all API keys are set
- Run `python -m alembic upgrade head`

### Frontend won't start

- Check Clerk keys are set
- Verify backend is running at NEXT_PUBLIC_API_URL
- Clear .next folder: `rm -rf .next`

### AI Counsellor not taking actions

- Run `python verify_ai_actions.py`
- Check Gemini API key is valid
- Verify function calling is enabled

### University recommendations empty

- Check onboarding is complete
- Verify universities.json is loaded
- Check filtering criteria (budget, countries, field)

## 📚 Additional Documentation

- `TEST_AI_COUNSELLOR.md` - Comprehensive testing guide for AI actions
- `verify_ai_actions.py` - Automated verification script

## 🚢 Deployment

### Backend (Production)

- Use PostgreSQL (not SQLite)
- Set secure DATABASE_URL
- Enable CORS for frontend domain
- Use production-grade ASGI server (Uvicorn + Gunicorn)

### Frontend (Production)

- Build: `npm run build`
- Deploy to Vercel/Netlify
- Set environment variables
- Configure API_URL to backend domain

## 🤝 Contributing

This is a hackathon project. For production use, consider:

- Adding comprehensive test coverage
- Implementing rate limiting
- Adding email notifications
- University data updates (deadlines, requirements)
- Document upload functionality
- Payment integration for premium features

## 📄 License

Educational/Hackathon Project

---

**EduGlobal** — Built with ❤️ for students pursuing their study-abroad dreams 🎓✨
