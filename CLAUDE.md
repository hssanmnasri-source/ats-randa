# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ATS RANDA is an Applicant Tracking System built with FastAPI (Python 3.11) + React 18 (TypeScript). It features NLP-powered CV parsing, semantic embedding-based matching via pgvector, role-based access control, and Celery async task queuing.

## Common Commands

### Docker (primary development environment)
```bash
make up          # Start all services
make down        # Stop all services
make build       # Rebuild and start
make logs        # Stream all logs
make migrate     # Run Alembic migrations
make db-shell    # PostgreSQL CLI
make clean       # Remove containers + volumes
```

### Backend (standalone)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Testing & Linting
```bash
make test              # Run pytest with coverage
make test-unit         # Unit tests only
make test-integration  # Integration tests only
make lint              # flake8 + black checks
make format            # Auto-format with black
```

### Frontend
```bash
cd frontend
npm install
npm run dev      # Dev server on port 3000
npm run build    # TypeScript check + Vite bundle
npm run preview  # Preview production build
```

## Backend Architecture

The backend follows a strict **Routes → Services → Repositories** layering, organized by user role.

```
backend/app/
├── main.py              # App entry, lifespan context, router registration
├── routes/              # HTTP endpoints, organized by role
│   ├── visitor/         # Auth, public job offers
│   ├── agent/           # CV upload, Keejob import, candidate management
│   ├── candidate/       # Profile, CV, applications
│   ├── rh/              # Job offers, matching, dashboard
│   └── admin/           # Users, stats, audit logs
├── services/            # Business logic (mirrors routes/ structure)
├── repositories/        # All DB queries (SQLAlchemy async sessions)
├── models/
│   ├── db_models.py     # SQLAlchemy ORM — single source of truth for schema
│   └── schemas/         # Pydantic request/response models, per role
├── nlp/                 # NLP pipeline modules
│   ├── keejob_parser.py    # Regex-based parser for Keejob-format CVs
│   ├── keejob_importer.py  # Bulk import with OCR fallback
│   ├── embedder.py         # sentence-transformers (paraphrase-multilingual-MiniLM-L12-v2, 384-dim)
│   ├── scorer.py           # Multi-criteria scoring logic
│   └── ocr.py              # Tesseract OCR (Arabic, French, English)
└── core/
    ├── config.py        # Settings loaded from .env
    ├── database.py      # Async SQLAlchemy session factory
    ├── security.py      # JWT (7-day expiry) + bcrypt
    └── celery_app.py    # Celery + Redis task queue config
```

### User Roles & Auth
Roles: `VISITOR`, `CANDIDATE`, `AGENT`, `RH`, `ADMIN`. Route-level guards are FastAPI dependencies (`require_agent`, `require_rh`, etc.) in `core/security.py`. JWT Bearer tokens are validated on every protected request.

### Key Data Models (db_models.py)
- `CV` — stores parsed text, source (`KEEJOB/AGENT/CANDIDAT/EMAIL/LINKEDIN`), status (`UPLOADED/PARSING/INDEXED/ERROR`), and a 384-dim pgvector embedding
- `JobOffer` — has its own pgvector embedding for semantic matching
- `Resultat` — links CV ↔ JobOffer with a score and `Decision` (`RETAINED/PENDING/REFUSED`)
- `Candidate` → has `Competences` and `Experiences` (one-to-many)

### Matching/Scoring
Multi-criteria scoring in `nlp/scorer.py`:
- **40%** semantic similarity (pgvector cosine distance between CV and offer embeddings)
- **35%** competency overlap (Jaccard similarity)
- **15%** experience match (years required vs. actual)
- **10%** language match

## Frontend Architecture

```
frontend/src/
├── pages/          # Route-level page components (one per role + auth)
├── components/     # Reusable UI components
├── hooks/          # Custom hooks: useAuth, useCVs, useOffers, useMatching, useDashboard, useAdmin
├── services/       # API layer: api.ts (axios instance), authService, cvService, offerService, matchingService
├── store/          # Zustand stores: authStore (user/token), notificationStore (toasts)
├── types/          # TypeScript interfaces
└── router/         # React Router 6 config with ProtectedRoute component
```

State management is intentionally minimal — Zustand only for cross-cutting concerns (auth, notifications). All data fetching goes through custom hooks wrapping the service layer.

## Infrastructure

Docker Compose services: `postgres` (5432), `redis` (6379), `backend` (8000), `celery_worker`, `flower` (5555), `nginx` (80), `prometheus` (9090), `grafana` (3001).

Nginx routes: `/api/*` and `/docs` → backend:8000, `/` → frontend:3000.

API docs available at `http://localhost:8000/docs` (Swagger) and `/redoc`.

## Environment Variables

All config lives in `.env` at the repo root. Key variables: `POSTGRES_*`, `REDIS_*`, `JWT_SECRET_KEY`, `CORS_ORIGINS`, `UPLOAD_DIR`, `MAX_FILE_SIZE_MB`. The backend reads these via `app/core/config.py`.
