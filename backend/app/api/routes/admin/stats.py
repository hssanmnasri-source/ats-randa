"""
api/routes/admin/stats.py
Statistiques globales pour l'admin.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.api.dependencies import require_admin
from app.models.db_models import User, CV, JobOffer, Resultat, Candidate, Decision

router = APIRouter(
    prefix="/api/admin",
    tags=["⚙️ Admin — Statistiques"],
    dependencies=[Depends(require_admin)],
)


@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    """Statistiques globales du système (users, CVs, offres, candidatures, candidats)."""

    total_users = await db.scalar(select(func.count(User.id)))
    user_roles_rows = await db.execute(
        select(User.role, func.count(User.id)).group_by(User.role)
    )
    users_par_role = {row.role.value: row[1] for row in user_roles_rows}

    total_cvs = await db.scalar(select(func.count(CV.id)))
    cv_statuts_rows = await db.execute(
        select(CV.statut, func.count(CV.id)).group_by(CV.statut)
    )
    cvs_par_statut = {row.statut.value: row[1] for row in cv_statuts_rows}

    total_offres = await db.scalar(select(func.count(JobOffer.id)))
    offres_statuts_rows = await db.execute(
        select(JobOffer.statut, func.count(JobOffer.id)).group_by(JobOffer.statut)
    )
    offres_par_statut = {row.statut.value: row[1] for row in offres_statuts_rows}

    total_resultats = await db.scalar(select(func.count(Resultat.id)))
    total_accepted  = await db.scalar(
        select(func.count(Resultat.id)).where(Resultat.decision == Decision.RETAINED)
    )
    total_refused   = await db.scalar(
        select(func.count(Resultat.id)).where(Resultat.decision == Decision.REFUSED)
    )
    total_pending   = await db.scalar(
        select(func.count(Resultat.id)).where(Resultat.decision == Decision.PENDING)
    )

    total_candidats = await db.scalar(select(func.count(Candidate.id)))

    return {
        "users":        {"total": total_users, "par_role": users_par_role},
        "cvs":          {"total": total_cvs,   "par_statut": cvs_par_statut},
        "offres":       {"total": total_offres, "par_statut": offres_par_statut},
        "candidatures": {
            "total":      total_resultats,
            "acceptees":  total_accepted,
            "refusees":   total_refused,
            "en_attente": total_pending,
        },
        "candidats":    {"total": total_candidats},
    }
