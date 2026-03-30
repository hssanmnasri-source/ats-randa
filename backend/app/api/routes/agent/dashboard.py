"""
api/routes/agent/dashboard.py
Dashboard de l'agent avec stats et candidats récents.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select, func

from app.core.database import get_db
from app.api.dependencies import require_agent
from app.models.db_models import CV, Resultat

router = APIRouter(
    prefix="/api/agent",
    tags=["📋 Agent — Dashboard"],
)


@router.get("/dashboard")
async def agent_dashboard(
    agent=Depends(require_agent),
    db: AsyncSession = Depends(get_db)
):
    """
    Dashboard complet de l'agent :
    - Stats CVs et candidatures
    - Liste des candidats récents
    """
    cvs_result = await db.execute(
        select(CV)
        .options(selectinload(CV.candidate))
        .options(selectinload(CV.resultats))
        .where(CV.id_agent == agent.id)
        .order_by(CV.created_at.desc())
    )
    cvs = cvs_result.scalars().all()

    total = len(cvs)
    indexes = sum(1 for cv in cvs if cv.statut.value == 'INDEXED')
    en_attente = sum(1 for cv in cvs if cv.statut.value in ('UPLOADED', 'PARSING'))
    erreurs = sum(1 for cv in cvs if cv.statut.value == 'ERROR')

    tous_resultats = [r for cv in cvs for r in cv.resultats]
    retenus = sum(1 for r in tous_resultats if r.decision.value == 'RETAINED')
    refuses = sum(1 for r in tous_resultats if r.decision.value == 'REFUSED')
    pending = sum(1 for r in tous_resultats if r.decision.value == 'PENDING')

    candidats_list = []
    for cv in cvs[:20]:
        best_result = max(cv.resultats, key=lambda r: r.score_final or 0, default=None)
        candidats_list.append({
            "cv_id": cv.id,
            "candidate_id": cv.id_candidate,
            "nom": cv.candidate.nom if cv.candidate else "?",
            "prenom": cv.candidate.prenom if cv.candidate else "?",
            "email": cv.candidate.email if cv.candidate else None,
            "cv_statut": cv.statut.value,
            "date_upload": cv.created_at.isoformat() if cv.created_at else None,
            "nb_candidatures": len(cv.resultats),
            "meilleur_score": best_result.score_final if best_result else None,
            "meilleure_decision": best_result.decision.value if best_result else None,
        })

    return {
        "stats": {
            "total_cvs": total,
            "indexes": indexes,
            "en_attente": en_attente,
            "erreurs": erreurs,
            "total_candidatures": len(tous_resultats),
            "retenus": retenus,
            "refuses": refuses,
            "pending": pending,
        },
        "candidats_recents": candidats_list,
    }


@router.get("/candidates/{cv_id}/results")
async def get_candidate_results(
    cv_id: int,
    agent=Depends(require_agent),
    db: AsyncSession = Depends(get_db)
):
    """Résultats de matching pour un candidat spécifique de l'agent"""
    cv_result = await db.execute(
        select(CV)
        .options(selectinload(CV.candidate))
        .where(CV.id == cv_id, CV.id_agent == agent.id)
    )
    cv = cv_result.scalar_one_or_none()
    if not cv:
        raise HTTPException(403, "CV introuvable ou accès refusé")

    resultats_result = await db.execute(
        select(Resultat)
        .options(selectinload(Resultat.offre))
        .where(Resultat.id_cv == cv_id)
        .order_by(Resultat.score_final.desc())
    )
    resultats = resultats_result.scalars().all()

    return {
        "cv_id": cv_id,
        "candidat": {
            "nom": cv.candidate.nom if cv.candidate else "?",
            "prenom": cv.candidate.prenom if cv.candidate else "?",
            "email": cv.candidate.email if cv.candidate else None,
        },
        "cv_statut": cv.statut.value,
        "resultats": [
            {
                "id": r.id,
                "offre_id": r.id_offre,
                "offre_titre": r.offre.titre if r.offre else "?",
                "score_final": r.score_final,
                "score_matching": r.score_matching,
                "score_skills": r.score_skills,
                "score_experience": r.score_experience,
                "score_langue": r.score_langue,
                "decision": r.decision.value,
                "date": r.date_analyse.isoformat() if r.date_analyse else None,
            }
            for r in resultats
        ],
    }
