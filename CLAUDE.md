# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Commands

All backend commands run **inside Docker** via `make` or `docker exec`.

### Start / Stop
```bash
make up          # Start all services (detached)
make down        # Stop
make build       # Rebuild images + start
make restart     # down + up
make shell       # bash inside ats_backend container
make db-shell    # psql interactive (ats_user / ats_db)
make status      # Show container status
make clean       # Remove containers + volumes
make info        # DB row counts + container state
make monitoring  # Print URLs for Grafana/Prometheus/Flower
```

### Tests
```bash
make test                                                          # pytest + coverage (all)
make test-unit                                                     # tests/unit/ only
make test-integration                                              # tests/integration/ only
docker exec ats_backend pytest tests/unit/test_scorer.py -v       # single test file
docker exec ats_backend pytest tests/ -k "test_login" -v          # single test by name
```

### Lint & Format (backend)
```bash
make lint        # flake8 + black --check (max-line-length=100)
make format      # black auto-format
```

### Frontend
The frontend runs **outside Docker** as a native npm process. Nginx proxies `/` → `host.docker.internal:3000`, so `npm run dev` must be running for the frontend to be accessible at `http://localhost`.

```bash
cd frontend
npm install
npm run dev      # Dev server on port 3000
npm run build    # TypeScript check + Vite bundle
```

The `@` alias in `vite.config.ts` resolves to `frontend/src/`.

### DB Migrations
```bash
make migrate                          # alembic upgrade head
make migrate-create name="add_field"  # generate new migration
```

Schema migrations that add nullable columns are done directly via psql rather than Alembic (no migration history for these columns): `make db-shell`.

### NLP / Embeddings
```bash
docker exec ats_backend python -m app.nlp.embed_existing_cvs  # backfill embeddings for all CVs
docker exec ats_backend python -m app.nlp.keejob_importer /app/uploads/keejob --all-files
```

### Monitoring URLs
- API docs: http://localhost:8000/docs
- Grafana: http://localhost:3001 (admin / admin123)
- Prometheus: http://localhost:9090
- Flower (Celery): http://localhost:5555
- n8n: http://localhost:5678

---

## Architecture

### Services (docker-compose.yml)
Containers on `ats_network`: `postgres` (pgvector/pg16), `redis`, `backend` (FastAPI), `celery_worker`, `flower`, `nginx` (port 80), `prometheus`, `grafana`, `redis-exporter`, `postgres-exporter`, `n8n` (port 5678).

The `.env` at the repo root is the single env file; both `backend` and `celery_worker` use it via `env_file: .env`. `POSTGRES_HOST=postgres` and `REDIS_HOST=redis` are the internal Docker hostnames.

### Backend — `backend/app/`

```
backend/app/
├── main.py              # App entry, lifespan context, router registration, custom OpenAPI
├── api/
│   ├── routes/          # HTTP endpoints, organized by role
│   │   ├── visitor/     # Auth (login/register), public job offers
│   │   ├── agent/       # CV upload/batch, dashboard, history, candidate management
│   │   ├── candidate/   # Profile, CV form submission, applications + timeline
│   │   ├── rh/          # Job offers CRUD, matching + feedback, dashboard, calendar, n8n
│   │   └── admin/       # Users, stats, audit logs, system health
│   └── dependencies.py  # Role-based access control dependencies
├── services/            # Business logic (mirrors routes/ structure)
├── repositories/        # All DB queries (SQLAlchemy async sessions)
├── models/
│   ├── db_models.py     # SQLAlchemy ORM — single source of truth for schema
│   └── schemas/         # Pydantic request/response models, per role (ACTIVE)
├── nlp/                 # NLP pipeline modules
│   ├── keejob_parser.py    # Regex-based parser for Keejob-format CVs (15+ fields)
│   ├── embedder.py         # sentence-transformers (paraphrase-multilingual-MiniLM-L12-v2, 384-dim)
│   ├── scorer.py           # Multi-criteria scoring logic
│   └── ocr.py              # Tesseract OCR (Arabic, French, English) + evaluate_ocr_quality()
├── tasks/               # Celery async tasks (cv_tasks.py, offer_tasks.py)
└── core/
    ├── config.py        # Settings loaded from .env (Pydantic BaseSettings)
    ├── database.py      # Async SQLAlchemy session factory + pgvector init
    ├── security.py      # JWT creation/validation + bcrypt password hashing
    ├── celery_app.py    # Celery + Redis task queue config
    └── mailer.py        # SMTP email sending (send_entretien_invitation())
```

**RBAC** is enforced via dependencies in `api/dependencies.py`. Use `require_candidate`, `require_rh`, `require_admin`, etc. as FastAPI `Depends`. `require_role(*roles)` is the underlying factory. The JWT payload contains `sub` (user id) and `role`.

**Route registration** is explicit in `main.py` — adding a new router requires an `app.include_router(...)` call there. Note: `admin/roles.py` and `admin/filiates.py` exist but are **not registered**.

**Layered pattern**: `routes/` → `services/` → `repositories/` → DB. Routes only call service functions; services call repository functions; repositories own all SQLAlchemy queries.

**Async everywhere**: all DB access uses `AsyncSession` from `core/database.py`. All route handlers and service functions are `async def`.

For candidate routes that need the `Candidate` record, always resolve via `candidate_repository.get_by_email(db, user.email)` — do not use `user.id` as a candidate ID directly.

### NLP Pipeline

CV matching flow:
1. A CV is uploaded → `tasks/cv_tasks.py::process_cv_on_upload` (Celery) runs OCR → parser → `embedder.py` → stores 384-dim vector in `cvs.embedding` (pgvector)
2. RH triggers matching on an offer → `services/rh/matching_service.py` queries pgvector cosinus top 200 → `scorer.py::compute_final_score` (40% semantic + 35% skills Jaccard + 15% experience + 10% language) → stores top 50 in `resultats`
3. **Immutability rule**: `RETAINED` and `REFUSED` decisions are never overwritten by re-matching. Only `PENDING` results are deleted and replaced.

Scoring weights are **per-offer customizable** via `PUT /api/rh/offers/{id}/poids`.

### Key Data Models (db_models.py)
- `CV` — `source` (`KEEJOB/AGENT/CANDIDAT`), `statut` (`UPLOADED/PARSING/INDEXED/ERROR`), 384-dim pgvector embedding. `source=KEEJOB` → `id_agent=NULL`; `source=AGENT` → `id_agent=agent.id`
- `JobOffer` — has its own pgvector embedding for semantic matching
- `Resultat` — CV ↔ JobOffer with multi-criteria scores, `Decision` (`RETAINED/PENDING/REFUSED`), `feedback_rh`, `feedback_visible`, `date_decision` (added via direct migration, not Alembic)
- `Candidate` → `Competences` and `Experiences` (one-to-many)
- `Entretien` — interview scheduling; statuts: `PROPOSE → CONFIRME → ENVOYE`, also `ANNULE`/`PLANIFIE`

### CV Repositories Filter
`candidate_repository.list_all()` accepts an optional `agent_id`. Always pass `agent_id=agent.id` in agent routes — without it, all 4,000+ Keejob candidates are returned.

### n8n Interview Automation (docs/n8n.md)
Business logic (slot generation, email sending) lives entirely in **backend Python**. n8n is an optional trigger/dashboard. The RH flow uses `/api/n8n/` routes:
- `POST /api/n8n/declencher-generation` — generates interview slots for all RETAINED candidates
- `POST /api/n8n/envoyer-emails-backend` — sends emails via `mailer.py`
- Webhook routes are secured by `X-N8N-Secret` header

n8n workflow JSONs live in `n8n/workflows/` and are imported via Settings → Import Workflow.

### Frontend — `frontend/src/`

**Tech stack**: Ant Design 5 (`antd`) + Tailwind CSS 4 (both active), TanStack React Query, Zustand, React Router 6, Recharts, FullCalendar (`@fullcalendar/react`).

**Auth**: `store/authStore.ts` (Zustand + `persist`) stores `{token, user}` in localStorage under key `ats-randa-auth`. `services/api.ts` (axios, `baseURL: http://localhost:8000`) reads the token via interceptor; 401 triggers logout.

**RBAC on routes**: `router/ProtectedRoute.tsx` wraps role-restricted sections. Each role has its own Layout (`RHLayout`, `CandidateLayout`, etc.) with its own sidebar.

**Data fetching**: custom hooks in `hooks/` wrap TanStack Query. Each hook calls a service function from `services/`. Do not call `api.ts` directly from pages — go through hook → service chain.

**Design system**: all brand colors live in `theme.ts`. `COLORS.primary = #8B1A1A`, `COLORS.gold = #C9A84C`, `COLORS.sidebarBg = #3D0C02`. Always import from `theme.ts` rather than hardcoding hex values.

**Images/assets** live in `frontend/public/` (served at `/`) and `frontend/public/icon/`.

**Favorites** — stored entirely in `localStorage` under key `ats_favorite_offers`. No backend endpoint.

**Application timeline** — `GET /api/candidate/applications/{id}/detail` returns a 4-step timeline rendered in `components/candidature/CandidatureTimeline.tsx`.

**CV Generator** (`/candidate/cv-generator`) — `components/cv/CVDocument.tsx` renders a printable A4 CV; uses `react-to-print ^3.3.0` hook API `useReactToPrint({ contentRef })`.

**N8NCalendarPage** (`/rh/n8n-calendar`) — polls every 5s/10s; never contacts n8n directly.

---

## Key Constraints

- **`backend/app/schemas/` is empty/legacy** — use `backend/app/models/schemas/` for all Pydantic schemas.
- **`backend/app/services/shared/email_service.py` and `file_service.py` are empty** — email logic lives in `core/mailer.py`.
- **`MAIL_ENABLED=false` by default** — emails are logged only; set `MAIL_ENABLED=true` + SMTP credentials to send real emails.
- The frontend `baseURL` in `services/api.ts` is hardcoded to `http://localhost:8000`. In production, update or proxy via Nginx.
- Black line length is **100** (not 88). CI uses `--max-line-length=100 --ignore=E501,W503`.
- `RETAINED` and `REFUSED` decisions are never overwritten by re-matching — only `PENDING` results are replaced.
