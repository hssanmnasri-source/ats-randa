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
make status      # Show container status
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
The frontend runs **outside Docker** as a native npm process (not a container):
```bash
cd frontend
npm install
npm run dev      # Dev server on port 3000 (required for nginx proxy to work)
npm run build    # TypeScript check + Vite bundle
```
Nginx proxies `/` → `host.docker.internal:3000`, so `npm run dev` must be running for the frontend to be accessible at `http://localhost`.

## Backend Architecture

The backend follows a strict **Routes → Services → Repositories** layering, organized by user role.

```
backend/app/
├── main.py              # App entry, lifespan context, router registration, custom OpenAPI
├── api/
│   ├── routes/          # HTTP endpoints, organized by role
│   │   ├── visitor/     # Auth (login/register), public job offers
│   │   ├── agent/       # CV upload, Keejob bulk import, candidate management
│   │   ├── candidate/   # Profile, CV form submission, applications
│   │   ├── rh/          # Job offers CRUD, matching, dashboard
│   │   └── admin/       # Users, stats, audit logs
│   └── dependencies.py  # Role-based access control dependencies (require_agent, require_rh, etc.)
├── services/            # Business logic (mirrors routes/ structure)
├── repositories/        # All DB queries (SQLAlchemy async sessions)
├── models/
│   ├── db_models.py     # SQLAlchemy ORM — single source of truth for schema
│   └── schemas/         # Pydantic request/response models, per role
├── nlp/                 # NLP pipeline modules
│   ├── keejob_parser.py    # Regex-based parser for Keejob-format CVs (15+ fields)
│   ├── keejob_importer.py  # Bulk import with OCR fallback
│   ├── embedder.py         # sentence-transformers (paraphrase-multilingual-MiniLM-L12-v2, 384-dim)
│   ├── scorer.py           # Multi-criteria scoring logic
│   └── ocr.py              # Tesseract OCR (Arabic, French, English)
├── tasks/               # Celery async tasks
│   ├── cv_tasks.py      # embed_cv(), embed_all_cvs()
│   └── offer_tasks.py   # embed_offer()
└── core/
    ├── config.py        # Settings loaded from .env (Pydantic BaseSettings)
    ├── database.py      # Async SQLAlchemy session factory + pgvector init
    ├── security.py      # JWT creation/validation + bcrypt password hashing
    └── celery_app.py    # Celery + Redis task queue config
```

### User Roles & Auth
Roles: `VISITOR`, `CANDIDATE`, `AGENT`, `RH`, `ADMIN`. Route-level guards are FastAPI dependencies in `api/dependencies.py` (`require_candidate`, `require_agent`, `require_rh`, `require_admin`). JWT Bearer tokens validated on every protected request. Token expiry: 60 minutes (configurable), refresh tokens: 7-day expiry.

### Key Data Models (db_models.py)
- `CV` — stores parsed text, `source` (`KEEJOB/AGENT/CANDIDAT`), `statut` (`UPLOADED/PARSING/INDEXED/ERROR`), and a 384-dim pgvector embedding
  - `source=KEEJOB` → bulk-imported, `id_agent=NULL` — not attributed to any agent
  - `source=AGENT` → uploaded by a specific agent, `id_agent=agent.id`
  - `source=CANDIDAT` → submitted by the candidate themselves
- `JobOffer` — has its own pgvector embedding for semantic matching
- `Resultat` — links CV ↔ JobOffer with multi-criteria scores and `Decision` (`RETAINED/PENDING/REFUSED`)
- `Candidate` → `Competences` and `Experiences` (one-to-many)

### Matching/Scoring (nlp/scorer.py)
- **40%** semantic similarity (pgvector cosine distance between CV and offer embeddings)
- **35%** competency overlap (Jaccard similarity)
- **15%** experience match (years required vs. actual, capped at 1.0)
- **10%** language match

Matching flow: pgvector pre-filters top 200 CVs by cosine similarity → 4-criteria scoring → top 50 stored in `resultats` table.

### CV Repositories Filter
`candidate_repository.list_all()` accepts an optional `agent_id` parameter. When passed, it filters candidates to only those with at least one CV with `source=AGENT AND id_agent=agent_id`. Always pass `agent_id=agent.id` in agent routes — without it, all 4,000+ Keejob candidates are returned incorrectly.

## Frontend Architecture

```
frontend/src/
├── pages/          # Route-level page components, one folder per role
├── components/     # Reusable UI components (common/, cv/, offer/, matching/, dashboard/)
├── hooks/          # Custom hooks: useAuth, useCVs, useOffers, useMatching, useDashboard, useAdmin
├── services/       # API layer: api.ts (axios + JWT interceptor), authService, cvService, offerService, matchingService, adminService
├── store/          # Zustand: authStore (user/token, persisted), notificationStore (toasts)
├── types/          # TypeScript interfaces
└── router/         # React Router 6 config with ProtectedRoute component
```

State management is intentionally minimal — Zustand only for cross-cutting concerns (auth, notifications). All data fetching goes through custom hooks wrapping the service layer.

**Vite proxy:** `vite.config.ts` proxies `/api` → `http://localhost:8000`, so both direct `:8000` and nginx-proxied `:80` work for API calls.

## Infrastructure

Docker Compose services: `postgres` (5432), `redis` (6379), `backend` (8000), `celery_worker`, `flower` (5555), `nginx` (80), `prometheus` (9090), `grafana` (3001).

Nginx routes: `/api/*` and `/docs` → `backend:8000`, `/` → `host.docker.internal:3000` (host npm dev server).

API docs: `http://localhost:8000/docs` (Swagger) and `/redoc`.

## Database State

Current production data:
- **4,131 CVs** — all `statut=INDEXED` with embeddings (no pending embedding work)
- **4,128 candidates**
- **2 job offers**
- ~18,000+ competences, ~12,000+ experiences

## Environment Variables

All config lives in `.env` at the repo root. Key variables: `POSTGRES_*`, `REDIS_*`, `SECRET_KEY`, `CORS_ORIGINS`, `UPLOAD_DIR`, `MAX_FILE_SIZE_MB`. The backend reads these via `app/core/config.py`.
