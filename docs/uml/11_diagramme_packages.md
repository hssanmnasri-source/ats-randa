# Diagramme de Packages — Organisation du Code Source

## Description

Ce diagramme représente l'organisation des packages (modules) de chaque surface applicative d'ATS RANDA — backend FastAPI, frontend React, et application mobile Flutter — ainsi que les dépendances entre packages. Il est construit à partir de la structure réelle des imports dans `backend/app/main.py`, `frontend/src/router/index.tsx`, et `mobile/lib/router.dart`. Les flèches indiquent les dépendances de consommation (le package A utilise le package B).

---

## Backend FastAPI — Packages Python

```mermaid
flowchart TD
    subgraph BACKEND["backend/app/"]
        MAIN["main.py\n(point d'entrée)\nlifespan, CORS, montage routeurs\nPrometheus instrumentator"]

        subgraph API_PKG["api/"]
            DEP["dependencies.py\nget_current_user()\nrequire_role(*roles)\nrequire_candidate/agent/rh/admin\nget_optional_user()"]

            subgraph ROUTES["routes/"]
                R_VIS["visitor/\nauth.py (login, register)\noffers.py (offres publiques)"]
                R_AUTH["auth/\ngoogle.py (OAuth2 callback)"]
                R_CAN["candidate/\nprofile.py\ncvs.py\napplications.py\ncover_letters.py\ndocuments.py"]
                R_AGT["agent/\ncvs.py\nimport_keejob.py\ncandidates.py\ndashboard.py"]
                R_RH["rh/\noffers.py\nmatching.py\ndashboard.py\ncvs.py\ncalendar.py\nn8n_webhook.py"]
                R_ADM["admin/\nusers.py\nstats.py\nsystem.py"]
            end
        end

        subgraph SVC["services/"]
            S_MATCH["matching_service.py\n(matching pgvector + scorer)"]
            S_CV["cv_service.py"]
            S_CAN["candidate_service.py"]
            S_OFF["offer_service.py"]
        end

        subgraph REPO["repositories/"]
            RR_CV["cv_repository.py"]
            RR_CAN["candidate_repository.py\n(list_all avec agent_id filter)"]
            RR_OFF["offer_repository.py"]
            RR_RES["resultat_repository.py"]
            RR_USR["user_repository.py"]
        end

        subgraph MODELS["models/"]
            DB_MOD["db_models.py\nUser, Filiale, Candidate, CV\nCompetence, Experience, JobOffer\nResultat, Entretien, AuditLog\nCoverLetter, CandidateDocument\n+ Enums (UserRole, CVStatus, etc.)"]
            SCHEMAS["schemas/\ncandidate_schemas.py\ncv_schemas.py\noffer_schemas.py\nresultat_schemas.py\n..."]
        end

        subgraph NLP["nlp/"]
            EMBED["embedder.py\n_get_model() lru_cache\nencode(text) → list[float]\nencode_batch(texts)\ncv_to_embed_text()\noffer_to_embed_text()"]
            SCORER["scorer.py\nscore_semantique() 40%\nscore_competences() Jaccard 35%\nscore_experience() ratio 15%\nscore_langue() binary 10%\ncompute_final_score()"]
            OCR["ocr.py\nextract_text_from_pdf()\nevaluate_ocr_quality()"]
            KP["keejob_parser.py\nparse_keejob_cv()"]
            GP["generic_parser.py\nparse_generic_cv()"]
        end

        subgraph TASKS["tasks/"]
            T_CV["cv_tasks.py\nembed_cv(cv_id)\nembed_all_cvs(batch)\nprocess_cv_on_upload(cv_id)"]
            T_OFF["offer_tasks.py\nembed_offer(offer_id)"]
        end

        subgraph CORE["core/ (transversal)"]
            CFG["config.py\nBaseSettings (.env)\nAPP_NAME, SECRET_KEY\nPOSTGRES_*, REDIS_*\nMAIL_*, N8N_SECRET"]
            DB["database.py\nAsyncSessionLocal\nBase (DeclarativeBase)\ninit_db(), get_db()"]
            SEC["security.py\nhash_password() bcrypt\nverify_password()\ncreate_access_token() HS256\ncreate_refresh_token() 7j\ndecode_token()"]
            CEL_APP["celery_app.py\nCelery + Redis broker\n(broker + backend URLs)"]
            MAIL["mailer.py\nsend_entretien_invitation()\nSMTP Gmail :587"]
        end
    end

    %% Dépendances
    MAIN --> API_PKG & CORE

    R_VIS & R_AUTH & R_CAN & R_AGT & R_RH & R_ADM --> DEP
    R_VIS & R_AUTH & R_CAN & R_AGT & R_RH & R_ADM --> SVC
    R_RH --> S_MATCH

    SVC --> REPO
    SVC --> NLP
    SVC --> TASKS
    SVC --> MAIL

    S_MATCH --> SCORER
    S_MATCH --> EMBED
    T_CV --> EMBED & SCORER & OCR & KP & GP
    T_OFF --> EMBED

    REPO --> DB_MOD & DB

    DEP --> SEC & DB
    SCHEMAS --> DB_MOD

    TASKS --> CEL_APP & DB
    MAIL --> CFG

    NLP -.->|"Modèle téléchargé\nau 1er run"| EMBED
```

---

## Frontend React — Packages TypeScript

```mermaid
flowchart TD
    subgraph FRONTEND["frontend/src/"]
        subgraph ENTRY["Entrée"]
            MAIN_TSX["main.tsx\nReact + ReactDOM\nTanStack QueryProvider\nRouterProvider"]
            APP["App.tsx\nAnt Design ConfigProvider\n(theme.ts tokens)"]
        end

        subgraph ROUTER_PKG["router/"]
            RT["index.tsx\ncreateBrowserRouter\nProtectedRoute (rôles)\nLazy loading toutes pages\nSuspense + PageLoader"]
            PROT["ProtectedRoute.tsx\nvérifie authStore.user.role"]
        end

        subgraph PAGES["pages/"]
            P_AUTH["auth/\nLoginPage\nRegisterPage\nGoogleCallbackPage"]
            P_PUB["public/\nHomePage\nOfferDetailPage"]
            P_CAN["candidate/\nDashboardPage, MyCVPage\nCVGeneratorPage, ApplicationsPage\nProfilePage, OffresPage\nOffreDetailPage, FavoritesPage\nCoverLettersPage, DocumentsPage\nSettingsPage"]
            P_AGT["agent/\nDashboardPage, UploadCVPage\nBatchUploadPage, CVListPage\nHistoryPage"]
            P_RH["rh/\nDashboardPage, OffersPage\nOfferFormPage, MatchingPage\nResultsPage, CVthequePage\nCandidaturesPage, CalendarPage\nN8NCalendarPage, StatsPage"]
            P_ADM["admin/\nDashboardPage, UsersPage\nUserFormPage, AuditPage\nSystemHealthPage, AdminCVsPage"]
        end

        subgraph LAYOUTS["layouts/"]
            LAY["PublicLayout, AuthLayout\nCandidateLayout, AgentLayout\nRHLayout, AdminLayout"]
        end

        subgraph COMPONENTS["components/"]
            COMP_CMN["common/\n(composants partagés)"]
            COMP_CV["cv/\nCVDocument.tsx (react-to-print)"]
            COMP_MATCH["matching/\nMatchResultTable.tsx"]
            COMP_CAND["candidature/\nCandidatureTimeline.tsx"]
        end

        subgraph HOOKS["hooks/"]
            HK["useOffers, useMatching\nuseCandidates, useStats\nuseFavorites (localStorage)"]
        end

        subgraph SERVICES["services/"]
            API_SVC["api.ts\nAxios instance\nbaseURL: localhost:8000\nIntercepteur request: Bearer token\nIntercepteur response: 401 → logout"]
            MSG_SVC["messageService.ts\nsingleton msg.success/error"]
            ROLE_SVC["rhService.ts, candidateService.ts\nagentService.ts, adminService.ts"]
        end

        subgraph STORE["store/"]
            AUTH_ST["authStore.ts\nZustand\n{user, token}\npersist(localStorage)"]
            NOTIF_ST["notificationStore.ts\nZustand\n{notifications[]}"]
        end

        subgraph TYPES["types/"]
            TYPES_PKG["agent.ts, candidature.ts\nmatching.ts, cv.ts\noffer.ts, user.ts"]
        end

        subgraph THEME_PKG["theme.ts"]
            THM["COLORS: primary #8B1A1A\ngold #C9A84C, sidebarBg #3D0C02\nAnt Design theme tokens"]
        end
    end

    %% Dépendances
    MAIN_TSX --> APP & ROUTER_PKG
    ROUTER_PKG --> PAGES & LAYOUTS & STORE
    PROT --> AUTH_ST

    PAGES --> HOOKS & COMPONENTS & SERVICES & TYPES & THM
    HOOKS --> SERVICES
    SERVICES --> API_SVC & AUTH_ST
    API_SVC --> AUTH_ST
    COMPONENTS --> THM & TYPES
    LAY --> THM & STORE
```

---

## Mobile Flutter — Packages Dart

```mermaid
flowchart TD
    subgraph MOBILE["mobile/lib/"]
        MAIN_DART["main.dart\nProviderScope\nAtsRandaApp (ConsumerWidget)\nMaterialApp.router (routerProvider)"]

        subgraph CORE_DART["core/"]
            API_CLI["api_client.dart\nDio singleton + BaseOptions\n_AuthInterceptor (injecte Bearer)\nsaveTokens / clearTokens / hasToken\nflutter_secure_storage"]
            THEME_DART["theme.dart\nkPrimary #8B1A1A\nkGold #C9A84C\nkDarkBrown #3D0C02\nbuildAppTheme() Material3"]
        end

        subgraph MODELS_DART["models/"]
            MOD["rh_user.dart (Freezed+JSON)\njob_offer.dart\nmatching_result.dart\ncv_summary.dart\ncalendar_event.dart\ndashboard_stats.dart"]
        end

        subgraph REPOS_DART["repositories/"]
            REP_AUTH["auth_repository.dart\nlogin() → POST /api/visitor/login\ngetProfile() → GET /api/rh/me"]
            REP_OFF["offers_repository.dart\ngetOffers() + createOffer()\nupdateOffer() + deleteOffer()"]
            REP_MATCH["matching_repository.dart\ngetResults(offerId)\nlaunchMatching(offerId)\nmakeDecision(offerId, resultId, ...)"]
            REP_CV["cvs_repository.dart\ngetCvList() → GET /api/rh/cvs"]
            REP_STATS["stats_repository.dart\ngetDashboardStats()\n(agrège /api/rh/me + /api/rh/dashboard/stats)"]
            REP_CAL["calendar_repository.dart\ngetEvents() → GET /api/rh/calendar"]
        end

        subgraph PROVIDERS_DART["providers/"]
            P_AUTH["auth_provider.dart\nauthStateProvider\nAsyncNotifierProvider\nAuthNotifier.build()\nlogin() / logout()"]
            P_OFF["offers_provider.dart\noffersProvider\nFutureProvider.autoDispose\noffersSearchQueryProvider (StateProvider)"]
            P_MATCH["matching_provider.dart\nmatchingResultsProvider(offerId)\nFutureProvider.autoDispose.family"]
            P_CV["cv_provider.dart\ncvListProvider\nFutureProvider.autoDispose"]
            P_DASH["dashboard_provider.dart\ndashboardStatsProvider\nFutureProvider"]
            P_CAL["calendar_provider.dart\ncalendarEventsProvider\nFutureProvider.autoDispose"]
        end

        subgraph ROUTER_DART["router.dart"]
            RT_DART["routerProvider (Provider GoRouter)\n_AuthChangeNotifier (ChangeNotifier)\nShellRoute (/dashboard /offers /cvtheque /calendar)\nDétail routes hors shell:\n/offers/:id, /offers/:id/matching\n/cvtheque/:id, /offers/create"]
        end

        subgraph UI_DART["ui/"]
            subgraph SCREENS["screens/"]
                SCR["login_screen.dart\ndashboard_screen.dart\noffers_screen.dart\noffer_detail_screen.dart\noffer_form_screen.dart\nmatching_results_screen.dart\ncvtheque_screen.dart\ncv_detail_screen.dart\ncalendar_screen.dart"]
            end
            subgraph WIDGETS["widgets/"]
                WGT["app_shell.dart (BottomNav 4 onglets)\nscore_ring.dart (indicateur circulaire)\ndecision_badge.dart (RETAINED/REFUSED)\noffer_card.dart\ncv_card.dart"]
            end
        end
    end

    %% Dépendances
    MAIN_DART --> P_AUTH & RT_DART & THEME_DART

    RT_DART --> P_AUTH & SCREENS
    SCREENS --> PROVIDERS_DART & WIDGETS & THEME_DART
    WIDGETS --> THEME_DART & MODELS_DART

    PROVIDERS_DART --> REPOS_DART & MODELS_DART
    P_AUTH --> REP_AUTH & API_CLI
    P_OFF --> REP_OFF
    P_MATCH --> REP_MATCH
    P_CV --> REP_CV
    P_DASH --> REP_STATS
    P_CAL --> REP_CAL

    REPOS_DART --> API_CLI & MODELS_DART
```

---

## Dépendances entre packages par surface

### Backend FastAPI — flux de données

```
HTTP Request
    ↓
api/routes/* (validation Pydantic, auth Depends)
    ↓
services/* (orchestration logique métier)
    ↓
repositories/* (requêtes SQL AsyncSession)
    ↓
models/db_models.py (SQLAlchemy ORM)
    ↓
PostgreSQL

Parallèlement :
services/* → nlp/* (embedder, scorer, ocr, parsers)
services/* → tasks/* → core/celery_app (file Redis)
services/* → core/mailer (SMTP)
Tous → core/config (variables .env)
Tous → core/database (AsyncSession)
api/dependencies → core/security (JWT)
```

### Frontend React — flux de données

```
Composant React (page)
    ↓
hooks/* (useQuery TanStack)
    ↓
services/*Service.ts (fonctions API)
    ↓
services/api.ts (Axios + intercepteurs)
    ↓
store/authStore.ts (token JWT depuis Zustand)
    ↓
HTTP → FastAPI :8000
```

### Mobile Flutter — flux de données

```
Écran Flutter (ConsumerWidget)
    ↓
ref.watch(xxxProvider) — Riverpod
    ↓
repositories/*.dart (appels HTTP)
    ↓
core/api_client.dart (Dio + _AuthInterceptor)
    ↓
flutter_secure_storage → Bearer token
    ↓
HTTP → FastAPI :8000
```
