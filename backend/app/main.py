from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import init_db
import logging
from app.api.routes.visitor.auth import router as auth_router
from app.api.routes.visitor.offers import router as visitor_offers_router
from app.api.routes.admin.users import router as admin_users_router
from app.api.routes.admin.stats import router as admin_stats_router
from app.api.routes.rh.offers import router as rh_offers_router
from app.api.routes.rh.dashboard import router as rh_dashboard_router
from app.api.routes.rh.matching import router as rh_matching_router
from app.api.routes.candidate.profile import router as candidate_profile_router
from app.api.routes.candidate.cvs import router as candidate_cvs_router
from app.api.routes.candidate.applications import router as candidate_applications_router
from app.api.routes.agent.cvs import router as agent_cvs_router
from app.api.routes.agent.import_keejob import router as agent_keejob_router
from app.api.routes.agent.candidates import router as agent_candidates_router



logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Starting ATS RANDA...")

    # ── Import tous les modèles AVANT init_db ──
    from app.models import db_models  # noqa: F401

    await init_db()
    logger.info("✅ Ready!")
    yield
    logger.info("🛑 Shutting down...")

_DESCRIPTION = """
## ATS RANDA — Applicant Tracking System

Plateforme de gestion et d'analyse automatisée de CVs développée dans le cadre d'un **Projet de Fin d'Études (PFE)** en Tunisie.

---

### Comment s'authentifier

1. Obtenez un token via **`POST /api/visitor/login`** ou **`POST /api/visitor/register`**
2. Cliquez sur le bouton **🔒 Authorize** en haut à droite
3. Entrez : `Bearer <votre_token>`
4. Toutes les requêtes suivantes incluront automatiquement le token

---

### Rôles & Accès

| Rôle | Endpoints accessibles |
|------|-----------------------|
| `VISITOR` | Offres publiques, inscription/connexion |
| `CANDIDATE` | Profil, CV (upload/formulaire), candidatures |
| `AGENT` | CVs (upload/liste/détail), candidats |
| `RH` | Offres (CRUD), matching, dashboard |
| `ADMIN` | Tout + gestion utilisateurs + statistiques |

---

### Pipeline NLP — Matching CV ↔ Offre

```
Offre → embedding 384-dim
                ↓
pgvector cosinus (top 200 CVs)
                ↓
Scoring multi-critères :
  40% sémantique  +  30% compétences
  20% expérience  +  10% langue
                ↓
Top 50 résultats → table resultats
```

---

### Données en base

| Table | Lignes |
|-------|--------|
| `cvs` | **4 131** (tous avec embedding) |
| `candidates` | **4 128** |
| `job_offers` | 2 (avec embedding) |
| `resultats` | 100 |
| `competences` | ~18 000+ |
| `experiences` | ~12 000+ |
"""

_TAGS = [
    {
        "name": "🔐 Auth",
        "description": "**Inscription** (`CANDIDATE`) et **connexion** (tous rôles) — retourne un JWT Bearer valable 7 jours.",
    },
    {
        "name": "🌐 Visitor — Offres",
        "description": "Consultation publique des offres d'emploi actives. **Aucune authentification requise.**",
    },
    {
        "name": "👤 Candidat — Profil",
        "description": "Gestion du profil personnel du candidat (nom, prénom, téléphone, adresse). `🔒 CANDIDATE`",
    },
    {
        "name": "👤 Candidat — CVs & Candidatures",
        "description": (
            "Dépôt de CV par **upload fichier** (PDF/DOCX/JPG/PNG ≤ 5 MB) "
            "ou **formulaire en ligne**. Consultation des CVs déposés. `🔒 CANDIDATE`"
        ),
    },
    {
        "name": "👤 Candidat — Candidatures",
        "description": "Postuler à une offre, lister ses candidatures, retirer une candidature (PENDING uniquement). `🔒 CANDIDATE`",
    },
    {
        "name": "📋 Agent — CVs physiques",
        "description": "Upload photo/PDF de CV physique avec OCR automatique. Liste et détail des CVs. `🔒 AGENT`",
    },
    {
        "name": "📥 Agent — Import Keejob",
        "description": "Import d'un CV au format Keejob (PDF Keejob → parsing regex → 15+ entités). `🔒 AGENT`",
    },
    {
        "name": "👤 Agent — Candidats",
        "description": "Navigation dans la base candidats avec recherche (nom/prénom/email) et pagination. `🔒 AGENT`",
    },
    {
        "name": "💼 RH — Offres d'emploi",
        "description": "CRUD complet des offres d'emploi (créer, modifier, clôturer, supprimer). `🔒 RH`",
    },
    {
        "name": "🎯 RH — Matching",
        "description": (
            "**POST** : lance le matching (pgvector + scoring) → stocke top N résultats. "
            "**GET** : résultats paginés filtrables par décision. "
            "**PATCH** : décision RH (`RETAINED` / `REFUSED` / `PENDING`). `🔒 RH`"
        ),
    },
    {
        "name": "📊 RH — Dashboard",
        "description": "Statistiques globales temps réel : CVs par source/statut, nouvelles candidatures, offres actives. `🔒 RH`",
    },
    {
        "name": "⚙️ Admin — Utilisateurs",
        "description": "CRUD utilisateurs, activation/désactivation de comptes. `🔒 ADMIN`",
    },
    {
        "name": "⚙️ Admin — Statistiques",
        "description": "Vue d'ensemble système : users/CVs/offres/candidatures par catégorie. `🔒 ADMIN`",
    },
]

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=_DESCRIPTION,
    openapi_tags=_TAGS,
    contact={
        "name": "ATS RANDA — PFE",
        "url":  "https://github.com/hssanmnasri-source/ats-randa",
    },
    license_info={
        "name": "Projet académique — PFE Tunisie",
    },
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router)
app.include_router(visitor_offers_router)
# Candidat
app.include_router(candidate_profile_router)
app.include_router(candidate_cvs_router)
app.include_router(candidate_applications_router)
# Agent
app.include_router(agent_cvs_router)
app.include_router(agent_keejob_router)
app.include_router(agent_candidates_router)
# RH
app.include_router(rh_offers_router)
app.include_router(rh_matching_router)
app.include_router(rh_dashboard_router)
# Admin
app.include_router(admin_users_router)
app.include_router(admin_stats_router)

@app.get("/health", tags=["Health"])
async def health():
    return {
        "status":  "ok",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    schema = get_openapi(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description=_DESCRIPTION,
        tags=_TAGS,
        routes=app.routes,
        contact={"name": "ATS RANDA — PFE", "url": "https://github.com/hssanmnasri-source/ats-randa"},
    )
    # Ajouter le schéma de sécurité HTTPBearer pour le bouton Authorize
    schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Entrez votre token JWT obtenu via `POST /api/visitor/login`",
        }
    }
    # Appliquer la sécurité à toutes les routes sauf login/register/health/offers publiques
    PUBLIC = {"/api/visitor/login", "/api/visitor/register", "/api/visitor/offers", "/health"}
    for path, methods in schema.get("paths", {}).items():
        if path in PUBLIC or (path == "/api/visitor/offers/{offer_id}"):
            continue
        for method_data in methods.values():
            method_data.setdefault("security", [{"BearerAuth": []}])
    app.openapi_schema = schema
    return schema


app.openapi = custom_openapi  # type: ignore