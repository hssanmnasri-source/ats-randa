from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from datetime import datetime, timezone, timedelta

from app.core.database import get_db
from app.api.dependencies import require_rh
from app.models.db_models import CV, Candidate, JobOffer, Resultat, OfferStatus, Decision

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


@router.get("/dashboard/stats")
async def get_rh_stats(
    rh=Depends(require_rh),
    db: AsyncSession = Depends(get_db),
):
    """Statistiques RH enrichies — KPIs personnalisés + candidatures 24h."""
    rh_id = rh.id
    now = datetime.now(timezone.utc)
    since_24h = now - timedelta(hours=24)

    # ── Offres du RH connecté ─────────────────────────────────────────────────
    total_offres = await db.scalar(
        select(func.count(JobOffer.id)).where(JobOffer.id_rh == rh_id)
    ) or 0
    actives = await db.scalar(
        select(func.count(JobOffer.id)).where(
            JobOffer.id_rh == rh_id,
            JobOffer.statut == OfferStatus.ACTIVE,
        )
    ) or 0
    archivees = await db.scalar(
        select(func.count(JobOffer.id)).where(
            JobOffer.id_rh == rh_id,
            JobOffer.statut == OfferStatus.ARCHIVED,
        )
    ) or 0

    # ── Candidatures sur les offres de ce RH ─────────────────────────────────
    rh_offer_ids_rows = await db.execute(
        select(JobOffer.id).where(JobOffer.id_rh == rh_id)
    )
    rh_offer_ids = rh_offer_ids_rows.scalars().all()

    total_cand = pending = retained = refused = nouvelles = 0
    if rh_offer_ids:
        total_cand = await db.scalar(
            select(func.count(Resultat.id)).where(
                Resultat.id_offre.in_(rh_offer_ids)
            )
        ) or 0
        pending = await db.scalar(
            select(func.count(Resultat.id)).where(
                Resultat.id_offre.in_(rh_offer_ids),
                Resultat.decision == Decision.PENDING,
            )
        ) or 0
        retained = await db.scalar(
            select(func.count(Resultat.id)).where(
                Resultat.id_offre.in_(rh_offer_ids),
                Resultat.decision == Decision.RETAINED,
            )
        ) or 0
        refused = await db.scalar(
            select(func.count(Resultat.id)).where(
                Resultat.id_offre.in_(rh_offer_ids),
                Resultat.decision == Decision.REFUSED,
            )
        ) or 0
        nouvelles = await db.scalar(
            select(func.count(Resultat.id)).where(
                Resultat.id_offre.in_(rh_offer_ids),
                Resultat.date_analyse >= since_24h,
            )
        ) or 0

    # ── CVthèque globale ──────────────────────────────────────────────────────
    total_cvs = await db.scalar(select(func.count(CV.id))) or 0
    avec_emb = await db.scalar(
        select(func.count(CV.id)).where(CV.embedding.is_not(None))
    ) or 0

    return {
        "mes_offres": {
            "actives":   actives,
            "archivees": archivees,
            "total":     total_offres,
        },
        "candidatures": {
            "total":         total_cand,
            "pending":       pending,
            "retained":      retained,
            "refused":       refused,
            "nouvelles_24h": nouvelles,
        },
        "cvtheque": {
            "total_cvs":      total_cvs,
            "avec_embedding": avec_emb,
        },
    }
