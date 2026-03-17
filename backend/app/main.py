from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import init_db
import logging
from app.api.routes.visitor.auth import router as auth_router
from app.api.routes.visitor.offers import router as visitor_offers_router
from app.api.routes.admin.users import router as admin_users_router
from app.api.routes.rh.offers import router as rh_offers_router
from app.api.routes.candidate.cvs import router as candidate_cvs_router
from app.api.routes.agent.cvs import router as agent_cvs_router
from app.api.routes.agent.import_keejob import router as agent_keejob_router
from app.api.routes.agent.candidates import router as agent_candidates_router
from app.api.routes.rh.dashboard import router as rh_dashboard_router
from app.api.routes.rh.matching import router as rh_matching_router



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

### Fonctionnalités principales

- **Import massif de CVs** : PDF (natif + scanné OCR), images JPG/PNG, Word DOCX/DOC
- **Parsing NLP** : extraction automatique de 15+ entités (nom, email, compétences, expériences, formations…)
- **Matching sémantique** : embeddings pgvector 384-dim pour le scoring CV ↔ offre
- **Gestion multi-rôles** : Visiteur, Candidat, Agent, RH, Admin

---

### Rôles & Authentification

| Rôle | Accès |
|------|-------|
| `VISITOR` | Consulter les offres publiques, s'inscrire |
| `CANDIDATE` | Déposer un CV, suivre ses candidatures |
| `AGENT` | Importer des CVs, gérer les candidats |
| `RH` | Créer des offres, consulter le matching |
| `ADMIN` | Gestion complète (utilisateurs, filiates) |

> **Authentification** : Bearer JWT — obtenez un token via `POST /api/visitor/login`

---

### Sources de CVs

| Source | Description |
|--------|-------------|
| `KEEJOB` | Import bulk depuis la plateforme Keejob |
| `AGENT` | Upload manuel par un agent |
| `CANDIDAT` | Dépôt via le portail candidat *(futur)* |
| `EMAIL` | Parsing email entrant *(futur)* |
| `LINKEDIN` | Import profil LinkedIn *(futur)* |

---

### Données disponibles
- **4 130+ CVs** importés et indexés
- **4 127+ candidats** en base
- **PostgreSQL + pgvector** pour le matching sémantique
"""

_TAGS = [
    {"name": "🔐 Auth",                    "description": "Inscription et connexion — retourne un JWT Bearer"},
    {"name": "🌐 Visitor — Offres",         "description": "Consultation publique des offres d'emploi actives"},
    {"name": "📄 Candidat — CVs",           "description": "Dépôt et suivi des CVs par le candidat"},
    {"name": "📋 Agent — CVs physiques",    "description": "Upload OCR (photo/PDF) + liste et détail des CVs"},
    {"name": "📥 Agent — Import Keejob",    "description": "Import d'un CV au format Keejob via API"},
    {"name": "👤 Agent — Candidats",        "description": "Navigation dans la base candidats avec recherche et pagination"},
    {"name": "💼 RH — Offres d'emploi",    "description": "Création et gestion des offres d'emploi"},
    {"name": "📊 RH — Dashboard",           "description": "Statistiques globales : CVs par source/statut, offres, nouveaux CVs"},
    {"name": "🛡️ Admin — Utilisateurs",    "description": "Gestion des comptes utilisateurs (ADMIN uniquement)"},
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
app.include_router(admin_users_router)
app.include_router(rh_offers_router)
app.include_router(candidate_cvs_router)
app.include_router(agent_cvs_router)
app.include_router(agent_keejob_router)
app.include_router(agent_candidates_router)
app.include_router(rh_dashboard_router)
app.include_router(rh_matching_router)

@app.get("/health")
async def health():
    return {
        "status":  "ok",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }