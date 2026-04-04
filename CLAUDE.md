# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Commands

All backend commands run **inside Docker** via `make` or `docker exec`.

### Start / Stop
```bash
make up          # Start all 10 services (detached)
make down        # Stop
make build       # Rebuild images + start
make restart     # down + up
make shell       # bash inside ats_backend container
make db-shell    # psql interactive (ats_user / ats_db)
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
```bash
cd frontend && npm run dev    # Dev server (port 5173)
cd frontend && npm run build  # TypeScript check + Vite build
cd frontend && npm run lint   # ESLint
```

### DB Migrations
```bash
make migrate                          # alembic upgrade head
make migrate-create name="add_field"  # generate new migration
```

### NLP / Embeddings
```bash
docker exec ats_backend python -m app.nlp.embed_existing_cvs  # backfill embeddings for all CVs
```

### Monitoring URLs
- API docs: http://localhost:8000/docs
- Grafana: http://localhost:3001 (admin / admin123)
- Prometheus: http://localhost:9090
- Flower (Celery): http://localhost:5555

---

## Architecture

### Services (docker-compose.yml)
10 containers on `ats_network`: `postgres` (pgvector/pg16), `redis`, `backend` (FastAPI), `celery_worker`, `flower`, `nginx` (port 80), `prometheus`, `grafana`, `redis-exporter`, `postgres-exporter`.

The `.env` at the repo root is the single env file; both `backend` and `celery_worker` use it via `env_file: .env`. `POSTGRES_HOST=postgres` and `REDIS_HOST=redis` are the internal Docker hostnames.

### Backend — `backend/app/`

**RBAC** is enforced via dependencies in `api/dependencies.py`. Use `require_candidate`, `require_rh`, `require_admin`, etc. as FastAPI `Depends`. `require_role(*roles)` is the underlying factory. The JWT payload contains `sub` (user id) and `role`.

**Route registration** is explicit in `main.py` — adding a new router requires an `app.include_router(...)` call there. Note: `admin/roles.py` and `admin/filiates.py` exist but are **not registered**.

**Layered pattern**: `routes/` → `services/` → `repositories/` → DB. Routes only call service functions; services call repository functions; repositories own all SQLAlchemy queries.

**Two schema locations** — `models/schemas/` is the active one (Pydantic v2 models used by routes). `schemas/` at the same level is a legacy stub directory with empty files; ignore it.

**Async everywhere**: all DB access uses `AsyncSession` from `core/database.py`. All route handlers and service functions are `async def`.

### NLP Pipeline

CV matching flow:
1. A CV is uploaded → `tasks/cv_tasks.py::process_cv_on_upload` (Celery) runs OCR → parser → `embedder.py` → stores 384-dim vector in `cvs.embedding` (pgvector)
2. RH triggers matching on an offer → `services/rh/matching_service.py` queries pgvector cosinus top 200 → `scorer.py::compute_final_score` (40% semantic + 35% skills Jaccard + 15% experience + 10% language) → stores top 50 in `resultats`
3. **Immutability rule**: `RETAINED` and `REFUSED` decisions are never overwritten by re-matching. Only `PENDING` results are deleted and replaced.

Scoring weights are **per-offer customizable** via `PUT /api/rh/offers/{id}/poids`.

### Frontend — `frontend/src/`

**Auth**: `store/authStore.ts` (Zustand + `persist`) stores `{token, user}` in localStorage under key `ats-randa-auth`. `services/api.ts` (axios) reads the token from Zustand on every request via an interceptor; 401 responses trigger logout + redirect.

**RBAC on routes**: `router/ProtectedRoute.tsx` wraps role-restricted sections. Each role has its own Layout (`RHLayout`, `CandidateLayout`, etc.) with its own sidebar.

**Data fetching**: custom hooks in `hooks/` wrap TanStack Query (`useQuery` / `useMutation`). Each hook calls a service function from `services/`. Do not call `api.ts` directly from pages — go through the hook → service chain.

**Images/assets** live in `frontend/public/` (served at `/`) and `frontend/public/icon/`.

---

## Key Constraints

- **`backend/app/schemas/` is empty/legacy** — use `backend/app/models/schemas/` for all Pydantic schemas.
- **`backend/app/services/shared/email_service.py` and `file_service.py` are empty** — email logic lives in `core/mailer.py`.
- **`MAIL_ENABLED=false` by default** — emails are logged only; set `MAIL_ENABLED=true` + SMTP credentials to send real emails.
- The frontend `baseURL` in `services/api.ts` is hardcoded to `http://localhost:8000`. In production, this must be updated or proxied via Nginx.
- Black line length is **100** (not 88). CI uses `--max-line-length=100 --ignore=E501,W503`.
