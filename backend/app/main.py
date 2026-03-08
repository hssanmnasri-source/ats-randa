from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import init_db
import logging

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

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Application de Traitement Automatisé des Candidatures",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {
        "status":  "ok",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }