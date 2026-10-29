# AI Requirement Analyzer & Prioritization System

An AI-powered system for analyzing software requirements, assessing quality, detecting conflicts, and prioritizing requirements using multi-criteria decision analysis (MCDA).

## Features

### AI Analysis Engine
- **Requirement Classification** — Automatically categorizes requirements as functional, non-functional, technical, business, or constraint using keyword-based NLP
- **Quality Scoring** — Scores each requirement 0-100 based on completeness, clarity, and testability
- **Ambiguity Detection** — Flags vague language ("approximately", "user-friendly", "fast", etc.) that reduces requirement quality
- **Completeness Assessment** — Checks for acceptance criteria, measurable metrics, and testability indicators
- **Urgency Detection** — Identifies urgency signals in requirement text (critical, blocker, deadline, etc.)
- **Dependency Extraction** — Automatically detects referenced requirement IDs and dependency patterns
- **Conflict Detection** — Finds contradictory requirements with similar content (must vs must not, allow vs deny)
- **Duplicate Detection** — Flags near-duplicate requirements using Jaccard text similarity

### Prioritization Engine
- **Weighted Scoring Model** — Combines business value, user impact, urgency, effort (inverted), and risk (inverted) with configurable weights
- **RICE Framework** — Computes Reach × Impact × Confidence / Effort scores
- **MoSCoW Classification** — Must have / Should have / Could have / Won't have
- **Priority Matrix** — Plots requirements on a value vs effort quadrant chart (Quick Wins, Strategic, Fill-ins, Time Sinks)
- **AI Recommendations** — Generates actionable insights (quick wins, high-risk items, ambiguous requirements, time sinks)

### Dashboard & Visualization
- Real-time charts: category distribution (pie), MoSCoW (bar), quality metrics (radial), status distribution
- Top priority requirements and high-risk items at a glance
- AI-generated recommendations panel

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.10+, FastAPI, SQLAlchemy, Pydantic v2 |
| Frontend | React 18, Vite 5, TailwindCSS, Recharts, Lucide Icons |
| Database | SQLite (default, zero-config) |
| AI/NLP | Built-in rule-based + statistical NLP engine (no external API needed) |

## Project Structure

```
ai-requirement-analyzer/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── config.py            # Settings from environment
│   │   ├── database.py          # SQLAlchemy engine & session
│   │   ├── seed.py              # Seed script for demo data
│   │   ├── models/              # ORM models (Project, Requirement, AnalysisResult)
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── services/            # Core AI engine
│   │   │   ├── nlp_service.py    # Text analysis, classification, ambiguity detection
│   │   │   ├── analyzer_service.py  # Orchestrates analysis, conflict/duplicate detection
│   │   │   └── prioritization_service.py  # Scoring, ranking, RICE, recommendations
│   │   ├── api/                 # REST endpoints (projects, requirements, analysis)
│   │   └── utils/               # Helpers
│   ├── requirements.txt
│   ├── .env.example
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Dashboard, Projects, Requirements, Analysis
│   │   ├── services/api.js      # Axios API client
│   │   └── seedData.js          # Frontend seed data for demos
│   ├── package.json
│   └── vite.config.js
├── data/
│   └── seed_requirements.json   # 10 sample requirements
├── .gitignore
└── README.md
```

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Copy env file
copy .env.example .env

# Run the server
python run.py
```

The API will be available at `http://localhost:8000` with interactive docs at `http://localhost:8000/docs`.

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Seed Demo Data (Optional)

After starting the backend, seed the database with sample requirements:

```bash
cd backend
python -m app.seed
```

This creates a demo project with 10 sample requirements and runs the full analysis + prioritization pipeline.

## API Endpoints

### Projects
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/projects/` | List all projects |
| GET | `/api/projects/{id}` | Get a project with its requirements |
| POST | `/api/projects/` | Create a project |
| PUT | `/api/projects/{id}` | Update a project |
| DELETE | `/api/projects/{id}` | Delete a project |

### Requirements
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/requirements/` | List requirements (filter by project_id, category, status) |
| GET | `/api/requirements/{id}` | Get a single requirement |
| POST | `/api/requirements/` | Create a requirement |
| POST | `/api/requirements/bulk` | Create multiple requirements |
| PUT | `/api/requirements/{id}` | Update a requirement |
| DELETE | `/api/requirements/{id}` | Delete a requirement |

### Analysis & Prioritization
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/analysis/run` | Run AI analysis on requirements |
| POST | `/api/analysis/prioritize` | Compute priority scores and rankings |
| GET | `/api/analysis/insights/{project_id}` | Get dashboard insights |
| GET | `/api/analysis/history/{requirement_id}` | Get analysis history for a requirement |

## How the AI Engine Works

### NLP Analysis Pipeline
1. **Text Cleaning** — Normalizes whitespace, tokenizes into words, removes stop words
2. **Keyword Extraction** — Frequency-based extraction with bigram boosting
3. **Category Classification** — Matches against domain-specific keyword dictionaries weighted by phrase length
4. **Ambiguity Detection** — Scans for 40+ vague terms and flags sentences lacking measurable specifics
5. **Completeness Assessment** — Checks for acceptance criteria, measurable terms, testability indicators, and specificity
6. **Quality Score** — Weighted combination: 60% completeness + 40% inverse ambiguity
7. **Urgency Detection** — Identifies critical/blocker/deadline signals and adjusts urgency score

### Prioritization Scoring
```
Priority Score = (
    Business Value    × 0.30 +
    User Impact       × 0.20 +
    Urgency           × 0.20 +
    (10 - Effort)     × 0.15 +
    (10 - Risk)       × 0.15
) × 10

Final Score = Priority Score ± Quality Modifier (±10%)
```

Weights are configurable via environment variables. The quality modifier gives well-specified requirements a small boost.

## Configuration

All settings are in `backend/.env` (see `.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 8000 | Backend port |
| `DATABASE_URL` | sqlite:///./requirement_analyzer.db | Database connection |
| `CORS_ORIGINS` | http://localhost:5173 | Allowed CORS origins |
| `WEIGHT_BUSINESS_VALUE` | 0.30 | Scoring weight |
| `WEIGHT_USER_IMPACT` | 0.20 | Scoring weight |
| `WEIGHT_URGENCY` | 0.20 | Scoring weight |
| `WEIGHT_EFFORT` | 0.15 | Scoring weight |
| `WEIGHT_RISK` | 0.15 | Scoring weight |
| `OPENAI_API_KEY` | (empty) | Optional: enable OpenAI-enhanced analysis |
