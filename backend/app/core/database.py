from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker
)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# ── Engine ────────────────────────────────────────
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# ── Base pour tous les modèles ────────────────────
class Base(DeclarativeBase):
    pass

# ── Initialisation ────────────────────────────────
async def init_db():
    async with engine.begin() as conn:
        # Activer pgvector
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        # Créer toutes les tables
        await conn.run_sync(Base.metadata.create_all)
        # Migrations légères idempotentes
        await conn.execute(text(
            "ALTER TABLE job_offers ADD COLUMN IF NOT EXISTS details JSONB"
        ))
        # Candidate extended profile (2026-03)
        _candidate_cols = [
            "ALTER TABLE candidates ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500)",
            "ALTER TABLE candidates ADD COLUMN IF NOT EXISTS titre_poste VARCHAR(255)",
            "ALTER TABLE candidates ADD COLUMN IF NOT EXISTS niveau_etude VARCHAR(50)",
            "ALTER TABLE candidates ADD COLUMN IF NOT EXISTS salaire_actuel VARCHAR(100)",
            "ALTER TABLE candidates ADD COLUMN IF NOT EXISTS disponibilite VARCHAR(100)",
            "ALTER TABLE candidates ADD COLUMN IF NOT EXISTS genre VARCHAR(20)",
            "ALTER TABLE candidates ADD COLUMN IF NOT EXISTS situation_familiale VARCHAR(50)",
            "ALTER TABLE candidates ADD COLUMN IF NOT EXISTS nationalite VARCHAR(100)",
            "ALTER TABLE candidates ADD COLUMN IF NOT EXISTS has_driving_license BOOLEAN DEFAULT FALSE",
            "ALTER TABLE candidates ADD COLUMN IF NOT EXISTS owns_car BOOLEAN DEFAULT FALSE",
            "ALTER TABLE candidates ADD COLUMN IF NOT EXISTS has_handicap BOOLEAN DEFAULT FALSE",
            "ALTER TABLE candidates ADD COLUMN IF NOT EXISTS visibility_status VARCHAR(20) DEFAULT 'VISIBLE'",
            "ALTER TABLE candidates ADD COLUMN IF NOT EXISTS alert_frequency VARCHAR(20) DEFAULT 'WEEKLY'",
            # Location & Mobility (2026-03)
            "ALTER TABLE candidates ADD COLUMN IF NOT EXISTS code_postal VARCHAR(10)",
            "ALTER TABLE candidates ADD COLUMN IF NOT EXISTS ville VARCHAR(100)",
            "ALTER TABLE candidates ADD COLUMN IF NOT EXISTS region VARCHAR(100)",
            "ALTER TABLE candidates ADD COLUMN IF NOT EXISTS mobilite_tn BOOLEAN DEFAULT FALSE",
            "ALTER TABLE candidates ADD COLUMN IF NOT EXISTS mobilite_intl BOOLEAN DEFAULT FALSE",
            # Professional preferences
            "ALTER TABLE candidates ADD COLUMN IF NOT EXISTS statut_pro VARCHAR(50)",
            "ALTER TABLE candidates ADD COLUMN IF NOT EXISTS secteurs_recherche JSONB DEFAULT '[]'",
            "ALTER TABLE candidates ADD COLUMN IF NOT EXISTS metiers_recherche JSONB DEFAULT '[]'",
        ]
        for stmt in _candidate_cols:
            await conn.execute(text(stmt))
        # Experience extended fields (2026-03)
        _exp_cols = [
            "ALTER TABLE experiences ADD COLUMN IF NOT EXISTS type_contrat VARCHAR(50)",
            "ALTER TABLE experiences ADD COLUMN IF NOT EXISTS taille_entreprise VARCHAR(50)",
            "ALTER TABLE experiences ADD COLUMN IF NOT EXISTS categorie_entreprise VARCHAR(100)",
            "ALTER TABLE experiences ADD COLUMN IF NOT EXISTS secteur_activite VARCHAR(255)",
            "ALTER TABLE experiences ADD COLUMN IF NOT EXISTS missions TEXT",
            "ALTER TABLE experiences ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT FALSE",
        ]
        for stmt in _exp_cols:
            await conn.execute(text(stmt))
    logger.info("✅ Database initialized — pgvector active")

# ── Dependency injection ──────────────────────────
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()