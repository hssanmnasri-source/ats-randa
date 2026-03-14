from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text

from app.core.database import get_db
from app.api.dependencies import require_rh
from app.models.db_models import CV, Candidate, JobOffer, OfferStatus

router = APIRouter(
    prefix="/api/rh",
    tags=["📊 RH — Dashboard"],
)


@router.get("/dashboard")
async def dashboard(
    rh=Depends(require_rh),
    db: AsyncSession = Depends(get_db),
):
    """Statistiques globales pour le tableau de bord RH."""

    # ── Totaux ────────────────────────────────────────────────────────────────
    total_candidates = await db.scalar(select(func.count()).select_from(Candidate))
    total_cvs        = await db.scalar(select(func.count()).select_from(CV))
    total_offers     = await db.scalar(select(func.count()).select_from(JobOffer))
    active_offers    = await db.scalar(
        select(func.count()).select_from(JobOffer).where(JobOffer.statut == OfferStatus.ACTIVE)
    )

    # ── CVs par statut ────────────────────────────────────────────────────────
    rows = await db.execute(
        select(CV.statut, func.count()).group_by(CV.statut)
    )
    cvs_by_statut = {row[0].value: row[1] for row in rows.fetchall()}

    # ── CVs par source ────────────────────────────────────────────────────────
    rows = await db.execute(
        select(CV.source, func.count()).group_by(CV.source)
    )
    cvs_by_source = {row[0].value: row[1] for row in rows.fetchall()}

    # ── Offres de ce RH ───────────────────────────────────────────────────────
    my_offers_total = await db.scalar(
        select(func.count()).select_from(JobOffer).where(JobOffer.id_rh == rh.id)
    )
    my_offers_active = await db.scalar(
        select(func.count()).select_from(JobOffer).where(
            JobOffer.id_rh == rh.id,
            JobOffer.statut == OfferStatus.ACTIVE,
        )
    )

    # ── Nouveaux CVs (7 derniers jours) ───────────────────────────────────────
    new_cvs_7d = await db.scalar(
        select(func.count()).select_from(CV).where(
            CV.date_depot >= text("NOW() - INTERVAL '7 days'")
        )
    )

    return {
        "candidates": {
            "total": total_candidates,
        },
        "cvs": {
            "total":      total_cvs,
            "new_7_days": new_cvs_7d,
            "by_statut":  cvs_by_statut,
            "by_source":  cvs_by_source,
        },
        "offers": {
            "total":           total_offers,
            "active":          active_offers,
            "my_total":        my_offers_total,
            "my_active":       my_offers_active,
        },
    }
