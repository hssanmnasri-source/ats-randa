# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ATS RANDA is an Applicant Tracking System with three client surfaces:
- **Backend**: FastAPI (Python 3.11) — NLP CV parsing, pgvector semantic matching, Celery async tasks, role-based JWT auth
- **Web frontend**: React 18 (TypeScript) — multi-role SPA (Candidate, Agent, RH, Admin)
- **Mobile**: Flutter — multi-role app (RH + Candidate) targeting Android/iOS/web

## Common Commands

### Docker (primary development environment)
A `Makefile` is available at the repo root. On Windows use `docker.exe` if the plain command fails.

```bash
make up              # Start all services
make down            # Stop all services
make restart         # Stop then start
make build           # Rebuild and start
make logs            # Stream all logs
make logs-backend    # Backend logs only
make logs-db         # Postgres logs only
make shell           # bash inside ats_backend container
make migrate         # Run Alembic migrations inside the backend container
make migrate-create name="my_migration"  # Generate new Alembic revision
make db-shell        # PostgreSQL CLI
make clean           # Remove containers + volumes (destructive)
make status          # Show container status
make test            # Run pytest with coverage
make test-unit       # Unit tests only
make test-integration  # Integration tests only
make lint            # flake8 + black checks
make format          # Auto-format with black
make security-scan   # bandit + safety checks
make info            # DB row counts + container state
make monitoring      # Print URLs for Grafana/Prometheus/Flower
make backup          # Dump PostgreSQL to backups/
make restore FILE=backups/ats_randa_*.sql.gz  # Restore a dump
make prod-up         # Start production Compose stack
make prod-down       # Stop production stack
make prod-build      # Rebuild and start production stack
make prod-logs       # Stream production logs
```

Docker container names for `docker exec`: `ats_backend`, `ats_postgres`, `ats_redis`.

#### Running a single test
```bash
docker exec ats_backend pytest tests/path/to/test_file.py::test_function_name -v
```

#### Test fixtures (`backend/tests/conftest.py`)
Pre-built JWT fixtures available in all tests: `rh_token`, `admin_token`, `agent_token`. Each returns an `AsyncClient` pre-authorized with the matching role. Use these rather than building your own auth headers.

#### Database migrations
Schema migrations that add nullable columns are done directly via psql rather than Alembic (no migration history for these columns):
```bash
make db-shell
```

### Backend (standalone)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
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
│   │   ├── auth/        # Google OAuth2 login (/api/auth/google/login, /callback)
│   │   ├── agent/       # CV upload/batch, dashboard, history, candidate management
│   │   ├── candidate/   # Profile, CV form submission, applications + timeline
│   │   ├── rh/          # Job offers CRUD, matching + feedback, dashboard, calendar, n8n
│   │   └── admin/       # Users, stats, audit logs, system health, roles, filiates
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
│   ├── cv_tasks.py      # process_cv_on_upload() [main], embed_cv(), embed_all_cvs()
│   ├── offer_tasks.py   # embed_offer()
│   └── alert_tasks.py   # check_seuil_alerte() — emails RH when match threshold reached
└── core/
    ├── config.py        # Settings loaded from .env (Pydantic BaseSettings)
    ├── database.py      # Async SQLAlchemy session factory + pgvector init
    ├── security.py      # JWT creation/validation + bcrypt password hashing
    ├── celery_app.py    # Celery + Redis task queue config
    ├── audit.py         # log_action() helper — writes to audit_logs table; call from any route that mutates data
    ├── logging_config.py # Loguru structured logging: colorized stdout (dev) + JSON file rotation (prod, when LOG_TO_FILE=true)
    └── mailer.py        # SMTP email sending — send_cv_received(), send_application_received(), send_decision_notification(), send_entretien_invitation(). Controlled by MAIL_ENABLED env var (defaults to false — logs without sending)
```

### User Roles & Auth
Roles: `VISITOR`, `CANDIDATE`, `AGENT`, `RH`, `ADMIN`. Route-level guards are FastAPI dependencies in `api/dependencies.py` (`require_candidate`, `require_agent`, `require_rh`, `require_admin`). JWT Bearer tokens validated on every protected request.

The dependency returns a **User** object (from `users` table). For candidate routes that need the `Candidate` record, always resolve via `candidate_repository.get_by_email(db, user.email)` — do not use `user.id` as a candidate ID directly.

### Key Data Models (db_models.py)
- `Filiale` — branch/subsidiary entity; `User.id_filiale` FK links users to branches
- `CV` — stores parsed text, `source` (`KEEJOB/AGENT/CANDIDAT/EMAIL/LINKEDIN`), `statut` (`UPLOADED/PARSING/INDEXED/ERROR`), a 384-dim pgvector embedding, and `cv_version` (integer, starts at 1, incremented on every upload/modification)
  - `source=KEEJOB` → bulk-imported, `id_agent=NULL`
  - `source=AGENT` → uploaded by a specific agent, `id_agent=agent.id`
  - `source=CANDIDAT` → submitted by the candidate themselves
- `JobOffer` — pgvector embedding + customizable per-offer scoring weights (`poids_semantique/competences/experience/langue`, defaulting to 40/35/15/10%); `seuil_alerte` triggers `alert_tasks.check_seuil_alerte()` when RETAINED count reaches the threshold; `OfferStatus` has 9 values: `ACTIVE/INACTIVE/ARCHIVED/BROUILLON/EN_VALIDATION/PROCHAINEMENT/DESACTIVEE/EXPIREE/REFUSEE`
- `Resultat` — links CV ↔ JobOffer with multi-criteria scores, `Decision` (`RETAINED/PENDING/REFUSED`), and optional `feedback_rh` / `feedback_visible` / `date_decision` fields added via direct migration (not Alembic)
- `Candidate` — extended profile with `visibility_status` (`VISIBLE/ANONYMOUS/INVISIBLE`), `alert_frequency` (`DAILY/TWICE_WEEK/WEEKLY/NEVER`), mobility flags (`mobilite_tn`, `mobilite_intl`), `statut_pro`, and JSONB arrays `secteurs_recherche` + `metiers_recherche`; has one-to-many `Competences` and `Experiences`
- `CoverLetter` — candidate-authored cover letters (`cover_letters` table), linked to `Candidate`
- `CandidateDocument` — uploaded files other than CV (`candidate_documents` table): type `CV|Diplome|CIN|Autre`
- `AuditLog` — admin action history (`audit_logs` table); populated via `core/audit.py::log_action()`; fields: `action`, `user_id`, `resource`, `resource_id`, `details` (JSONB), `ip_address`
- `Entretien` — interview scheduling table created by n8n workflow; statuts: `PROPOSE → CONFIRME → ENVOYE`, also `ANNULE`/`PLANIFIE`

### Matching/Scoring (nlp/scorer.py)
Default weights (overridable per-offer via `JobOffer.poids_*` columns):
- **40%** semantic similarity (pgvector cosine distance between CV and offer embeddings)
- **35%** competency overlap (Jaccard similarity — `score_skills=1.0` when no skills required)
- **15%** experience match (years required vs. actual, capped at 1.0)
- **10%** language match

Matching flow: pgvector pre-filters top 200 CVs by cosine similarity → 4-criteria scoring → top 50 stored in `resultats` table.

**RH Decision Immutability (critical business rule):** `Decision.RETAINED` and `Decision.REFUSED` on `Resultat` records are **permanently immutable**. The Celery task `process_cv_on_upload` and the RH manual matching both skip (never overwrite) any result with those decisions — only `PENDING` results are recalculated or created. When the RH triggers matching manually: `force=False` returns existing results if available; `force=True` recalculates scores but still preserves all RETAINED/REFUSED decisions. See `backend/BUSINESS_RULES.md` for the full rules.

**Primary Celery task — `tasks.process_cv_on_upload`:** Auto-triggered after every CV upload or modification. Steps: (1) extract PDF text if `cv_text` is empty, (2) parse entities via `keejob_parser` (KEEJOB source) or `generic_parser` (AGENT/CANDIDAT), (3) generate embedding + increment `cv_version`, (4) match against all ACTIVE offers — create PENDING results for new pairs, update scores for existing PENDING, skip RETAINED/REFUSED.

### CV Repositories Filter
`candidate_repository.list_all()` accepts an optional `agent_id` parameter. When passed, it filters candidates to only those with at least one CV with `source=AGENT AND id_agent=agent_id`. Always pass `agent_id=agent.id` in agent routes — without it, all 4,000+ Keejob candidates are returned incorrectly.

### n8n Interview Automation (docs/n8n.md)
Business logic (slot generation, email sending) lives entirely in the **backend Python**. n8n is an optional trigger/dashboard at `http://localhost:5678`. The RH flow uses `/api/n8n/` routes:
- `POST /api/n8n/declencher-generation` — generates interview slots for all RETAINED candidates
- `POST /api/n8n/envoyer-emails-backend` — sends emails via `mailer.py`
- Webhook routes (`/api/n8n/creneaux-generes`, `/api/n8n/entretiens/emails-envoyes`) are secured by `X-N8N-Secret` header

n8n workflow JSONs live in `n8n/workflows/` and are imported via Settings → Import Workflow in the n8n UI.

### Adding New Routes
Register every new router in `main.py` with `app.include_router(...)`. Schema migrations that are low-risk (adding nullable columns) are done directly via `psql` in the running container rather than through Alembic, since there is no migration history for these columns.

**Unregistered admin routes:** `routes/admin/filiates.py`, `routes/admin/roles.py`, and `routes/admin/audit.py` exist but are **not** wired into `main.py` — their endpoints are unreachable. Check registration before assuming an admin endpoint is live.

**Schemas directory note:** Two schemas directories exist — `backend/app/schemas/` (thin, mostly empty re-export stubs) and `backend/app/models/schemas/` (real Pydantic models). Always work in `models/schemas/`; the stubs in `app/schemas/` are legacy placeholders.

**Special endpoints:** `/health` (liveness probe) and `/uploads` (static file serving for profile photos and CV files) are mounted directly in `main.py`. Prometheus metrics are exposed at `/metrics` when `prometheus-fastapi-instrumentator` is installed.

### NLP Embedder — critical async rule
`nlp/embedder.py::encode()` and `encode_batch()` are **synchronous** and load a CPU-bound PyTorch model. Calling them directly inside an async route or service **blocks the entire event loop**, freezing all concurrent requests (including login) until the model finishes.

**Always wrap in `run_in_executor`:**
```python
import asyncio
loop = asyncio.get_event_loop()
embedding = await loop.run_in_executor(None, encode, text)
```

The model is pre-warmed at startup in `main.py::lifespan()` via `run_in_executor` so the first real request doesn't pay the cold-start cost (~5–10s on CPU).

## Frontend Architecture

### Tech Stack
- **UI**: Ant Design 5 (`antd`) + Tailwind CSS 4 — both are active in this project
- **Data fetching**: TanStack React Query (`@tanstack/react-query`) — all server state goes through it
- **Global state**: Zustand (auth token/user, notifications only)
- **Routing**: React Router 6 with role-based `ProtectedRoute`
- **Charts**: Recharts
- **Calendar**: FullCalendar (`@fullcalendar/react` + daygrid/timegrid/interaction)
- **Animations**: Framer Motion (`framer-motion`) — used for homepage section transitions
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

### Ant Design `message` API (`services/messageService.ts`)
A singleton wrapper around Ant Design's `message` API. Components import `{ msg }` from `@/services/messageService` and call `msg.success(...)`, `msg.error(...)`, etc. The `MessageInstance` is registered once at app root via `setMessageInstance`. Always use `msg` instead of calling `message` directly from `antd` to avoid the "can only be used inside React component" warning.

### Route Lazy Loading
All page components in `router/index.tsx` are loaded with `React.lazy()` + `Suspense`. Only `LoginPage` and `RegisterPage` are eagerly imported (needed at startup). When adding a new page, always use `lazy(() => import('...'))` — never add a static import at the top of the router file. Heavy deps (FullCalendar, Recharts, `@ant-design/icons`) are pre-bundled via `optimizeDeps.include` in `vite.config.ts`.

### Data Fetching Pattern
Use TanStack Query in hooks, not directly in components. Query keys follow the pattern `['role', 'resource']` (e.g. `['candidate', 'profile']`, `['rh', 'offers']`). Default `staleTime` is 5 minutes.

### Candidate Portal (`/candidate`)
Pages: `DashboardPage`, `MyCVPage`, `CVGeneratorPage`, `ApplicationsPage`, `ProfilePage`, `CoverLettersPage`, `DocumentsPage`, `SettingsPage`, `FavoritesPage`, `OffresPage`, `OffreDetailPage`.

**Favorites** (`useFavorites` hook) — stored entirely in `localStorage` under key `ats_favorite_offers`. No backend endpoint.

**Application timeline** — `GET /api/candidate/applications/{id}/detail` returns a 4-step timeline (POSTULÉ → ANALYSE IA → EN EXAMEN → DÉCISION) plus per-criteria scores and optional RH feedback. Rendered in `components/candidature/CandidatureTimeline.tsx`, opened from `ApplicationsPage` via an Ant Design Drawer.

#### CV Generator (`/candidate/cv-generator`)
- **Component**: `frontend/src/components/cv/CVDocument.tsx` — `React.forwardRef` rendering CV in Keejob style (A4, inline CSS, brand colours).
- **Page**: `frontend/src/pages/candidate/CVGeneratorPage.tsx` — uses `useFullProfile()` + `react-to-print` for PDF export.
- **Data source**: `GET /api/candidate/profile/full` — returns `{ profile, completion, experiences, skills, langues, formations }`. `formations` and `langues` are extracted from `cv_entities` JSONB of the candidate's indexed CVs.
- **Library**: `react-to-print ^3.3.0` (hook API: `useReactToPrint({ contentRef })`).

#### `FullProfileOut` schema (backend + frontend)
Both `candidate_schemas.py` and `types/cv.ts` include `formations: List[dict]` / `formations: FormationOut[]`. Keep them in sync when adding fields.

### Public Pages (`/`)
`HomePage` — public job listings (no auth). `OfferDetailPage` — public offer detail with apply button that redirects to login if not authenticated.

### Auth Pages (`/auth`)
`LoginPage`, `RegisterPage` (eagerly imported), `GoogleCallbackPage` (lazy) — handles the OAuth2 redirect from `/api/auth/google/callback`, exchanges the code, stores the token, and redirects to the appropriate role dashboard.

### Agent Portal (`/agent`)
Pages: `DashboardPage`, `UploadCVPage`, `BatchUploadPage`, `CVListPage`, `HistoryPage`.

**OCR quality** (`nlp/ocr.py::evaluate_ocr_quality`) — heuristic scoring 0–100 based on character count, presence of email/phone/section keywords. Returns `{ score, niveau, message, conseils, nb_caracteres, a_email, a_telephone, a_sections }`.

**Single Keejob import**: `POST /api/agent/import/keejob` (`routes/agent/import_keejob.py`) — uploads one PDF, parses it synchronously with `keejob_parser`, creates Candidate + CV with `statut=INDEXED`, returns extracted entities immediately.

### RH Portal (`/rh`)
Pages: `DashboardPage`, `OffersPage`, `OfferFormPage`, `MatchingPage`, `ResultsPage`, `CVthequePage`, `CandidaturesPage`, `CalendarPage`, `N8NCalendarPage`, `StatsPage`.

The `MatchResultTable` component opens a Modal on Retenir/Refuser to collect feedback before confirming.

`GET /api/rh/offers/{offer_id}/matching` supports advanced candidate filters: `score_min`, `age_min/max`, `region`, `ville`, `niveau_etude`, `niveau_experience`, `disponibilite`, `has_driving_license`. When any advanced filter is present, `result_repository.list_by_offer_filtered()` is used instead of the plain `list_by_offer()`.

`PATCH /api/rh/offers/{offer_id}/matching/{result_id}` accepts `{ decision, feedback_rh?, feedback_visible? }`. When `feedback_visible=true`, feedback is visible to candidate. Setting RETAINED or REFUSED also fires `send_decision_notification()` (fire-and-forget) to the candidate's email.

`GET /api/rh/offers/{offer_id}/export/pdf` generates and returns a PDF matching report (all ranked candidates) via `services/rh/pdf_export.py`.

**CalendarPage** (`/rh/calendar`) — standalone FullCalendar for manual interview scheduling via `GET /api/rh/calendar`. Distinct from N8NCalendarPage.

**N8NCalendarPage** (`/rh/n8n-calendar`) — polls `['n8n', 'propose']` every 5s and `['n8n', 'calendrier']` every 10s. Supports inline edit (`PUT /api/n8n/entretiens/{id}` via Drawer) and delete (`DELETE /api/rh/calendar/{id}` via Popconfirm) of PROPOSE-status interviews before confirmation. The frontend never contacts n8n directly; all requests go through backend `/api/n8n/` routes.

**StatsPage** (`/rh/stats`) — per-offer analytics (line + pie charts via Recharts). Fetches data per selected offer.

### Admin Portal (`/admin`)
Pages: `DashboardPage`, `UsersPage`, `UserFormPage`, `AdminCVsPage`, `AuditPage`, `SystemHealthPage`.

## Mobile App (Flutter — Multi-role)

A Flutter app in `mobile/lib/` supporting two roles after login: **RH** and **CANDIDATE**. The same `/api/visitor/login` endpoint is used; the returned `role` field drives all routing decisions.

### Stack
- **State**: Riverpod (`flutter_riverpod`) — `AsyncNotifierProvider` for auth, `FutureProvider.autoDispose` everywhere else
- **Navigation**: `go_router` with two separate `ShellRoute`s (one per role) and detail routes outside shells
- **HTTP**: `dio` with JWT Bearer interceptor (`lib/core/api_client.dart`)
- **Auth storage**: `flutter_secure_storage` (keys: `access_token`, `refresh_token`)
- **Models**: RH models use `freezed` + `json_serializable`; **candidate models are plain Dart classes** (no code generation needed)

### Two-role architecture

After login the router redirect checks `user.role`:
- `'rh'` → `/dashboard` (RH `AppShell` — 4 tabs: Tableau de bord, Offres, CVthèque, Calendrier)
- `'candidate'` → `/candidate/dashboard` (Candidate `CandidateShell` — 4 tabs: Accueil, Offres, Candidatures, Profil)

Cross-role navigation is blocked by the redirect guard in `router.dart`. `auth_repository.dart::getProfile(role)` calls `/api/rh/me` for RH and `/api/candidate/profile` for candidates, both returning a `RhUser` (the shared auth model) populated with the relevant fields.

### Structure
```
mobile/lib/
├── core/
│   ├── api_client.dart        # Dio singleton, _AuthInterceptor, saveTokens/clearTokens/hasToken
│   └── theme.dart             # kPrimary, kGold, kGoldLight, kDarkBrown + buildAppTheme()
├── models/
│   ├── rh_user.dart           # Freezed — shared auth user for both roles (id, email, nom, prenom, role)
│   ├── job_offer.dart         # Freezed — RH offer model
│   ├── matching_result.dart   # Freezed — RH matching result
│   ├── calendar_event.dart    # Freezed — RH interview event
│   ├── dashboard_stats.dart   # Plain class — RH dashboard stats (from /api/rh/dashboard)
│   ├── candidate_profile.dart # Plain class — CandidateProfile, FullProfile, Experience, Skill
│   ├── candidate_cv.dart      # Plain class — CandidateCV
│   ├── application.dart       # Plain class — Application, ApplicationDetail, TimelineStep
│   ├── cover_letter.dart      # Plain class — CoverLetter
│   └── public_offer.dart      # Plain class — PublicOffer (from /api/visitor/offers)
├── repositories/              # Thin API wrappers, one file per domain
├── providers/                 # Riverpod providers, one file per domain
├── ui/
│   ├── screens/
│   │   ├── (rh screens)       # DashboardScreen, OffersScreen, CvthequeScreen, CalendarScreen, …
│   │   └── candidate/         # CandidateDashboardScreen, CandidateOffersScreen,
│   │                          #   CandidateApplicationsScreen, CandidateApplicationDetailScreen,
│   │                          #   CandidateProfileScreen, CandidateCvsScreen,
│   │                          #   CandidateOfferDetailScreen, CandidateCoverLettersScreen
│   └── widgets/
│       ├── app_shell.dart         # RH bottom nav (4 tabs)
│       ├── candidate_shell.dart   # Candidate bottom nav (4 tabs)
│       └── status_badge.dart      # Shared interview status chip
├── main.dart    # ProviderScope → AtsRandaApp → MaterialApp.router
└── router.dart  # routerProvider: two ShellRoutes + _AuthChangeNotifier + role-based redirect
```

### Key architectural patterns
- **Router auth redirect**: `_AuthChangeNotifier` listens to `authStateProvider` and calls `notifyListeners()`, feeding GoRouter's `refreshListenable`. Login/logout automatically triggers re-evaluation of redirect rules — no manual `context.go` calls needed anywhere.
- **Plain vs. freezed models**: Only RH models (`RhUser`, `JobOffer`, `MatchingResult`, `CalendarEvent`) use `freezed`. All candidate models are plain Dart classes with `fromJson` factories and manual `copyWith` where needed. When adding new RH models, run `dart run build_runner build --delete-conflicting-outputs`; candidate models need no code generation.
- **`DashboardStats`**: plain class in `repositories/stats_repository.dart` (not in `models/`) — aggregated from `/api/rh/dashboard`. Import directly from the repository file.
- **Live search**: `candidateOfferSearchProvider` (`StateProvider<String>`) is watched by `candidateOffersProvider` (`FutureProvider.autoDispose`) — changing the query auto-refetches without any manual trigger.
- **Apply flow**: `CandidateOfferDetailScreen` calls `CandidateApplicationRepository().apply(offerId)` directly (no provider) since it's a one-shot mutation. The response may include `cv_required` if no CV is registered.

### API base URL
Configured via compile-time `--dart-define`:
```bash
flutter run -d chrome                                          # http://localhost:8000 (default)
flutter run -d emulator-5554 --dart-define=API_URL=http://10.0.2.2:8000  # Android emulator
```

### Mobile commands
```bash
cd mobile
flutter pub get
flutter run -d chrome          # web dev (no emulator needed)
flutter run                    # auto-select connected device
flutter build apk              # release APK
flutter analyze                # static analysis (must show "No issues found")
dart run build_runner build --delete-conflicting-outputs   # only needed after editing freezed RH models
```

### CORS for Flutter web
`main.py` uses `allow_origin_regex=r"http://localhost:\d+"` — any localhost port works, so Flutter web's random port is always accepted.

### Stale scaffold files (ignore)
Old empty scaffolding at the `mobile/` root — all real code is under `mobile/lib/`:
- `mobile/main.dart`, `mobile/router.dart`
- `mobile/repositories/` (5 files), `mobile/viewmodels/` (5 files)

## Infrastructure

Docker Compose services: `postgres` (5432), `redis` (6379), `backend` (8000), `celery_worker`, `flower` (5555), `nginx` (80), `prometheus` (9090), `grafana` (3001), `n8n` (5678), `redis-exporter`, `postgres-exporter`.

Nginx routes: `/api/*` and `/docs` → `backend:8000`, `/` → `host.docker.internal:3000` (host npm dev server).

API docs: `http://localhost:8000/docs` (Swagger) and `/redoc`.

## Environment Variables

All config lives in `.env` at the repo root. Key variables: `POSTGRES_*`, `REDIS_*`, `SECRET_KEY`, `CORS_ORIGINS`, `UPLOAD_DIR`, `MAX_FILE_SIZE_MB`, `MAIL_*`, `N8N_*`, `GRAFANA_*`. The backend reads these via `app/core/config.py` (Pydantic BaseSettings with `extra="ignore"` to allow extra vars like `GRAFANA_*`). See `.env.example` for the full list.

**Google OAuth** (required for `GoogleCallbackPage`): set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback` in `.env`. The callback route lives in `routes/auth/google.py`.

**`MAIL_ENABLED`**: defaults to `false` — all mailer calls log to stdout instead of sending real emails. Set to `true` only when `MAIL_*` SMTP credentials are configured.
