"""
api/routes/admin/stats.py
Statistiques globales enrichies pour l'admin.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from datetime import datetime, timedelta, timezone

from app.core.database import get_db
from app.api.dependencies import require_admin
from app.models.db_models import User, CV, JobOffer, Resultat, Candidate, Decision, UserRole, CVSource

router = APIRouter(
    prefix="/api/admin",
    tags=["⚙️ Admin — Statistiques"],
    dependencies=[Depends(require_admin)],
)


@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    """Statistiques globales enrichies (users, CVs, offres, matching, top RH)."""
    now = datetime.now(timezone.utc)
    il_y_a_7j  = now - timedelta(days=7)
    il_y_a_30j = now - timedelta(days=30)

    # ── Users ─────────────────────────────────────────
    total_users  = await db.scalar(select(func.count(User.id)))
    actifs_users = await db.scalar(select(func.count(User.id)).where(User.is_active == True))
    nouveaux_7j  = await db.scalar(
        select(func.count(User.id)).where(User.created_at >= il_y_a_7j)
    )
    role_rows = await db.execute(
        select(User.role, func.count(User.id)).group_by(User.role)
    )
    par_role = {row.role.value: row[1] for row in role_rows}

    # ── CVs ───────────────────────────────────────────
    total_cvs   = await db.scalar(select(func.count(CV.id)))
    indexes_cvs = await db.scalar(
        select(func.count(CV.id)).where(CV.embedding.is_not(None))
    )
    erreurs_cvs = await db.scalar(
        select(func.count(CV.id)).where(CV.statut == "ERROR")
    )
    cv_nouveaux_7j  = await db.scalar(
        select(func.count(CV.id)).where(CV.created_at >= il_y_a_7j)
    )
    cv_nouveaux_30j = await db.scalar(
        select(func.count(CV.id)).where(CV.created_at >= il_y_a_30j)
    )
    source_rows = await db.execute(
        select(CV.source, func.count(CV.id)).group_by(CV.source)
    )
    par_source = {row.source.value: row[1] for row in source_rows}

    statut_rows = await db.execute(
        select(CV.statut, func.count(CV.id)).group_by(CV.statut)
    )
    par_statut = {row.statut.value: row[1] for row in statut_rows}

    # ── Offres ────────────────────────────────────────
    total_offres   = await db.scalar(select(func.count(JobOffer.id)))
    actives_offres = await db.scalar(
        select(func.count(JobOffer.id)).where(JobOffer.statut == "ACTIVE")
    )
    archivees_offres = await db.scalar(
        select(func.count(JobOffer.id)).where(JobOffer.statut == "ARCHIVED")
    )

    # ── Matching ──────────────────────────────────────
    total_resultats = await db.scalar(select(func.count(Resultat.id)))
    decision_rows = await db.execute(
        select(Resultat.decision, func.count(Resultat.id)).group_by(Resultat.decision)
    )
    par_decision = {row.decision.value: row[1] for row in decision_rows}
    score_moyen_row = await db.scalar(select(func.avg(Resultat.score_final)))
    score_moyen = round(float(score_moyen_row or 0), 3)

    # ── Top RH ────────────────────────────────────────
    top_rh_rows = await db.execute(
        text("""
            SELECT u.id, u.nom, u.prenom, u.email,
                   COUNT(DISTINCT jo.id) AS nb_offres,
                   COUNT(r.id)           AS nb_candidatures
            FROM users u
            LEFT JOIN job_offers jo ON jo.id_rh = u.id
            LEFT JOIN resultats r   ON r.id_offre = jo.id
            WHERE u.role = 'RH'
            GROUP BY u.id, u.nom, u.prenom, u.email
            ORDER BY nb_offres DESC, nb_candidatures DESC
            LIMIT 5
        """)
    )
    top_rh = [
        {
            "id": row.id,
            "nom": row.nom,
            "prenom": row.prenom,
            "email": row.email,
            "nb_offres": row.nb_offres,
            "nb_candidatures": row.nb_candidatures,
        }
        for row in top_rh_rows.fetchall()
    ]

    # ── Candidats ─────────────────────────────────────
    total_candidats = await db.scalar(select(func.count(Candidate.id)))

    return {
        "users": {
            "total":       total_users,
            "actifs":      actifs_users,
            "par_role":    par_role,
            "nouveaux_7j": nouveaux_7j,
        },
        "cvs": {
            "total":          total_cvs,
            "indexes":        indexes_cvs,
            "erreurs":        erreurs_cvs,
            "par_statut":     par_statut,
            "par_source":     par_source,
            "nouveaux_7j":    cv_nouveaux_7j,
            "nouveaux_30j":   cv_nouveaux_30j,
        },
        "offres": {
            "total":     total_offres,
            "actives":   actives_offres,
            "archivees": archivees_offres,
        },
        "matching": {
            "total_resultats": total_resultats,
            "par_decision":    par_decision,
            "score_moyen":     score_moyen,
        },
        "candidats": {"total": total_candidats},
        "top_rh":    top_rh,
    }
