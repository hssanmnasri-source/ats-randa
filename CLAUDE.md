# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ATS RANDA is an Applicant Tracking System built with FastAPI (Python 3.11) + React 18 (TypeScript). It features NLP-powered CV parsing, semantic embedding-based matching via pgvector, role-based access control, and Celery async task queuing.

## Common Commands

### Docker (primary development environment)
On Windows, use `docker.exe` instead of `docker` if the plain command fails.

```bash
make up          # Start all services
make down        # Stop all services
make build       # Rebuild and start
make logs        # Stream all logs
make migrate     # Run Alembic migrations inside the backend container
make db-shell    # PostgreSQL CLI
make clean       # Remove containers + volumes
make status      # Show container status
```

Docker container names for `docker exec`: `ats_backend`, `ats_postgres`, `ats_redis`.

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

### Useful one-liners
```bash
# Backfill embeddings for all CVs without one
docker exec ats_backend python -m app.nlp.embed_existing_cvs --batch-size 128

# Bulk import Keejob CVs from a folder
docker exec ats_backend python -m app.nlp.keejob_importer /app/uploads/keejob --all-files

# Check DB row counts
docker exec ats_backend python -c "
import asyncio, sys; sys.path.insert(0, '/app')
from app.core.database import AsyncSessionLocal
from sqlalchemy import text
async def main():
    async with AsyncSessionLocal() as db:
        for t in ['candidates','cvs','competences','experiences','job_offers','resultats']:
            r = await db.execute(text(f'SELECT COUNT(*) FROM {t}')); print(f'{t}: {r.scalar()}')
asyncio.run(main())"
```

## Backend Architecture

The backend follows a strict **Routes → Services → Repositories** layering, organized by user role.

```
backend/app/
├── main.py              # App entry, lifespan context, router registration, custom OpenAPI
├── api/
│   ├── routes/          # HTTP endpoints, organized by role
│   │   ├── visitor/     # Auth (login/register), public job offers
│   │   ├── agent/       # CV upload/batch, dashboard, history, candidate management
│   │   ├── candidate/   # Profile, CV form submission, applications + timeline
│   │   ├── rh/          # Job offers CRUD, matching + feedback, dashboard
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
│   ├── ocr.py              # Tesseract OCR (Arabic, French, English) + evaluate_ocr_quality()
│   ├── general_cv_parser.py # Generic CV parser for non-Keejob format CVs
│   ├── generic_parser.py   # Fallback parser
│   ├── extractor.py        # Field extraction utilities
│   ├── language_detector.py # Language detection for multilingual CVs
│   └── parser.py           # Unified parser entry point
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
Roles: `VISITOR`, `CANDIDATE`, `AGENT`, `RH`, `ADMIN`. Route-level guards are FastAPI dependencies in `api/dependencies.py` (`require_candidate`, `require_agent`, `require_rh`, `require_admin`). JWT Bearer tokens validated on every protected request.

The dependency returns a **User** object (from `users` table). For candidate routes that need the `Candidate` record, always resolve via `candidate_repository.get_by_email(db, user.email)` — do not use `user.id` as a candidate ID directly.

### Key Data Models (db_models.py)
- `CV` — stores parsed text, `source` (`KEEJOB/AGENT/CANDIDAT`), `statut` (`UPLOADED/PARSING/INDEXED/ERROR`), and a 384-dim pgvector embedding
  - `source=KEEJOB` → bulk-imported, `id_agent=NULL`
  - `source=AGENT` → uploaded by a specific agent, `id_agent=agent.id`
  - `source=CANDIDAT` → submitted by the candidate themselves
- `JobOffer` — has its own pgvector embedding for semantic matching
- `Resultat` — links CV ↔ JobOffer with multi-criteria scores, `Decision` (`RETAINED/PENDING/REFUSED`), and optional `feedback_rh` / `feedback_visible` / `date_decision` fields added via direct migration (not Alembic)
- `Candidate` → `Competences` and `Experiences` (one-to-many)

### Matching/Scoring (nlp/scorer.py)
- **40%** semantic similarity (pgvector cosine distance between CV and offer embeddings)
- **35%** competency overlap (Jaccard similarity)
- **15%** experience match (years required vs. actual, capped at 1.0)
- **10%** language match

Matching flow: pgvector pre-filters top 200 CVs by cosine similarity → 4-criteria scoring → top 50 stored in `resultats` table.

### CV Repositories Filter
`candidate_repository.list_all()` accepts an optional `agent_id` parameter. When passed, it filters candidates to only those with at least one CV with `source=AGENT AND id_agent=agent_id`. Always pass `agent_id=agent.id` in agent routes — without it, all 4,000+ Keejob candidates are returned incorrectly.

### Adding New Routes
Register every new router in `main.py` with `app.include_router(...)`. Schema migrations that are low-risk (adding nullable columns) are done directly via `psql` in the running container rather than through Alembic, since there is no migration history for these columns.

## Frontend Architecture

### Tech Stack
- **UI**: Ant Design 5 (`antd`) with a custom dark-red/gold brand theme
- **Data fetching**: TanStack React Query (`@tanstack/react-query`) — all server state goes through it
- **Global state**: Zustand (auth token/user, notifications only)
- **Routing**: React Router 6 with role-based `ProtectedRoute`
- **Icons**: `@ant-design/icons`

### Design System
All brand colors and the Ant Design theme override live in `frontend/src/theme.ts`:
- `COLORS.primary` = `#8B1A1A` (dark red — buttons, links)
- `COLORS.gold` / `COLORS.goldLight` = `#C9A84C` / `#F0D080` (accents, table headers)
- `COLORS.sidebarBg` / `COLORS.darkBrown` = `#3D0C02` (all sidebar backgrounds)

Always import from `theme.ts` rather than hardcoding hex values.

### Folder Structure
```
frontend/src/
├── pages/          # Route-level page components, one folder per role
├── components/     # Reusable UI components (common/, cv/, offer/, matching/, dashboard/, candidature/)
├── hooks/          # Custom hooks wrapping TanStack Query
├── services/       # API layer: api.ts (axios + JWT interceptor), then per-role service files
├── store/          # Zustand: authStore (user/token, persisted), notificationStore (toasts)
├── types/          # TypeScript interfaces (agent.ts, candidature.ts, matching.ts, cv.ts, …)
├── layouts/        # Per-role layouts (AgentLayout, RHLayout, CandidateLayout, etc.)
└── router/         # React Router 6 config with ProtectedRoute component
```

### API Client (`services/api.ts`)
Axios instance with `baseURL: 'http://localhost:8000'`. All endpoint paths include the `/api/` prefix (e.g. `/api/candidate/profile`). The request interceptor auto-attaches the JWT Bearer token from Zustand. A 401 response triggers automatic logout and redirect to `/login`.

**Vite proxy:** `vite.config.ts` also proxies `/api` → `http://localhost:8000` as a fallback for build-time usage.

### Data Fetching Pattern
Use TanStack Query in hooks, not directly in components. Query keys follow the pattern `['role', 'resource']` (e.g. `['candidate', 'profile']`, `['rh', 'offers']`). Default `staleTime` is 5 minutes.

### Candidate Portal (`/candidate`)
Pages: `DashboardPage`, `MyCVPage`, `CVGeneratorPage`, `ApplicationsPage`, `ProfilePage`, `CoverLettersPage`, `DocumentsPage`, `SettingsPage`, `FavoritesPage`, `OffresPage`, `OffreDetailPage`.

**Favorites** (`useFavorites` hook) — stored entirely in `localStorage` under key `ats_favorite_offers`. No backend endpoint.

**Application timeline** — `GET /api/candidate/applications/{id}/detail` returns a 4-step timeline (POSTULÉ → ANALYSE IA → EN EXAMEN → DÉCISION) plus per-criteria scores and optional RH feedback. Rendered in `components/candidature/CandidatureTimeline.tsx`, opened from `ApplicationsPage` via an Ant Design Drawer.

Backend endpoints (via `candidateService`):
- Profile: `GET/PUT /api/candidate/profile`, sub-routes `/personal`, `/professional`, `/visibility`, `/completion`, `/photo`
- Full profile: `GET /api/candidate/profile/full`
- Experiences: `GET/POST /api/candidate/profile/experiences`, `DELETE /api/candidate/profile/experiences/{id}`
- Skills: `GET/POST /api/candidate/profile/skills`, `DELETE /api/candidate/profile/skills/{id}`
- CVs: `GET/POST /api/candidate/cvs`
- Cover letters: `GET/POST /api/candidate/cover-letters`, `PUT/DELETE /api/candidate/cover-letters/{id}`
- Documents: `GET /api/candidate/documents`, `POST /api/candidate/documents/upload`, `DELETE /api/candidate/documents/{id}`
- Applications: `GET /api/candidate/applications`, `GET /api/candidate/applications/{id}/detail`, `POST /api/candidate/offers/{id}/apply`, `DELETE /api/candidate/applications/{id}`

#### CV Generator (`/candidate/cv-generator`)
- **Component**: `frontend/src/components/cv/CVDocument.tsx` — `React.forwardRef` rendering CV in Keejob style (A4, inline CSS, brand colours).
- **Page**: `frontend/src/pages/candidate/CVGeneratorPage.tsx` — uses `useFullProfile()` + `react-to-print` for PDF export.
- **Data source**: `GET /api/candidate/profile/full` — returns `{ profile, completion, experiences, skills, langues, formations }`. `formations` and `langues` are extracted from `cv_entities` JSONB of the candidate's indexed CVs.
- **formations structure** (from Keejob parser): `{ diplome, etablissement, type, statut, mention, date_debut, date_fin, pays }`.
- **Library**: `react-to-print ^3.3.0` (hook API: `useReactToPrint({ contentRef })`).

#### `FullProfileOut` schema (backend + frontend)
Both `candidate_schemas.py` and `types/cv.ts` include `formations: List[dict]` / `formations: FormationOut[]`. Keep them in sync when adding fields.

### Agent Portal (`/agent`)
Pages: `DashboardPage`, `UploadCVPage`, `BatchUploadPage`, `CVListPage`, `HistoryPage`.

Backend endpoints:
- `GET /api/agent/dashboard` — stats (total CVs, indexed, pending, errors, retained/refused/pending decisions) + recent candidates list
- `GET /api/agent/candidates/{cv_id}/results` — matching results for a specific CV owned by this agent
- `POST /api/agent/cvs/upload` — single CV upload; accepts optional `offer_id` (Form field); response includes `ocr_quality` dict from `evaluate_ocr_quality()`
- `POST /api/agent/cvs/batch` — upload up to 10 files at once; returns per-file OCR quality scores
- `GET /api/agent/history` — paginated activity log with per-CV matching decisions
- `GET /api/agent/cvs` — paginated list filtered to this agent's CVs
- `GET /api/agent/cvs/{cv_id}` — CV detail

**OCR quality** (`nlp/ocr.py::evaluate_ocr_quality`) — heuristic scoring 0–100 based on character count, presence of email/phone/section keywords. Returns `{ score, niveau, message, conseils, nb_caracteres, a_email, a_telephone, a_sections }`.

### RH Portal (`/rh`)
Pages: `DashboardPage`, `OffersPage`, `OfferFormPage`, `MatchingPage`, `ResultsPage`, `CVthequePage`, `CandidaturesPage`.

Backend endpoints:
- `GET /api/rh/dashboard` — RH stats and recent activity
- `GET /api/rh/dashboard/stats` — aggregated stats for charts
- `GET /api/rh/offers` — paginated job offers list
- `POST /api/rh/offers` — create offer (triggers async embedding via Celery)
- `GET/PUT /api/rh/offers/{offer_id}` — get/update offer
- `DELETE /api/rh/offers/{offer_id}` — archive offer (soft delete)
- `POST /api/rh/offers/{offer_id}/matching` — launch matching (pgvector → scorer → top 50 stored)
- `GET /api/rh/offers/{offer_id}/matching` — get matching results
- `PATCH /api/rh/offers/{offer_id}/matching/{result_id}` — update decision; accepts `{ decision, feedback_rh?, feedback_visible? }`. When `feedback_visible=true`, feedback is visible to candidate.
- `GET /api/rh/offers/{offer_id}/export/pdf` — export matching results as PDF
- `GET /api/rh/cvs/search` — search CVs in the cvthèque

The `MatchResultTable` component opens a Modal on Retenir/Refuser to collect feedback before confirming.

### Admin Portal (`/admin`)
Pages: `DashboardPage`, `UsersPage`, `UserFormPage`, `AdminCVsPage`, `AuditPage`, `SystemHealthPage`.

Backend endpoints:
- `GET /api/admin/stats` — global platform statistics
- `GET /api/admin/system/health` — system health (DB, Redis, Celery, disk, memory)
- `POST /api/admin/system/reindex` — trigger re-embedding of all CVs via Celery
- `GET /api/admin/audit/logs` — paginated audit log
- `GET /api/admin/cvs` — all CVs across all sources
- `GET /api/admin/users` — user list
- `POST /api/admin/users` — create user
- `GET/PUT /api/admin/users/{user_id}` — get/update user
- `PATCH /api/admin/users/{user_id}/toggle` — activate/deactivate user

## Infrastructure

Docker Compose services: `postgres` (5432), `redis` (6379), `backend` (8000), `celery_worker`, `flower` (5555), `nginx` (80), `prometheus` (9090), `grafana` (3001).

Nginx routes: `/api/*` and `/docs` → `backend:8000`, `/` → `host.docker.internal:3000` (host npm dev server).

API docs: `http://localhost:8000/docs` (Swagger) and `/redoc`.

## Environment Variables

All config lives in `.env` at the repo root. Key variables: `POSTGRES_*`, `REDIS_*`, `SECRET_KEY`, `CORS_ORIGINS`, `UPLOAD_DIR`, `MAX_FILE_SIZE_MB`. The backend reads these via `app/core/config.py`. See `.env.example` for the full list.
