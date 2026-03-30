"""
api/routes/candidate/applications.py
Routes de candidature pour l'espace candidat.
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select

from app.core.database import get_db
from app.api.dependencies import require_candidate
from app.services.candidate import application_service
from app.models.db_models import Resultat, CV

router = APIRouter(
    prefix="/api/candidate",
    tags=["👤 Candidat — Candidatures"],
)


@router.post("/offers/{offer_id}/apply", status_code=201)
async def apply_to_offer(
    offer_id: int,
    candidate=Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    """
    Postuler à une offre d'emploi.

    - L'offre doit être ACTIVE
    - Vous devez avoir un CV enregistré (upload ou formulaire)
    - Retourne `cv_required` si aucun CV présent
    """
    return await application_service.apply_to_offer(db, offer_id, candidate)


@router.get("/applications", status_code=200)
async def list_applications(
    page:  int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    candidate=Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    """Liste mes candidatures avec statut et détail de l'offre."""
    return await application_service.list_applications(db, candidate, page, limit)


@router.get("/applications/{result_id}/detail", status_code=200)
async def get_candidature_detail(
    result_id: int,
    candidate=Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    """Détail complet d'une candidature avec timeline et feedback RH."""
    from app.repositories import candidate_repository

    # Lookup candidate by email (user.email → candidate record)
    candidate_record = await candidate_repository.get_by_email(db, candidate.email)
    if not candidate_record:
        raise HTTPException(404, "Profil candidat introuvable")

    # Récupérer tous les CVs du candidat
    cvs_result = await db.execute(
        select(CV).where(CV.id_candidate == candidate_record.id)
    )
    cvs = cvs_result.scalars().all()
    cv_ids = [cv.id for cv in cvs]

    if not cv_ids:
        raise HTTPException(404, "CV introuvable")

    # Récupérer le résultat appartenant à ce candidat
    result = await db.execute(
        select(Resultat)
        .options(selectinload(Resultat.offre))
        .where(
            Resultat.id == result_id,
            Resultat.id_cv.in_(cv_ids),
        )
    )
    resultat = result.scalar_one_or_none()
    if not resultat:
        raise HTTPException(404, "Candidature introuvable")

    timeline = _build_timeline(resultat)

    return {
        "id": resultat.id,
        "offre_id": resultat.id_offre,
        "offre_titre": resultat.offre.titre,
        "date_candidature": resultat.date_analyse,
        "decision": resultat.decision.value,
        "score_final": resultat.score_final or 0.0,
        "score_matching": resultat.score_matching or 0.0,
        "score_skills": resultat.score_skills or 0.0,
        "score_experience": resultat.score_experience or 0.0,
        "score_langue": resultat.score_langue or 0.0,
        "feedback_rh": resultat.feedback_rh if resultat.feedback_visible else None,
        "feedback_visible": bool(resultat.feedback_visible),
        "date_decision": resultat.date_decision,
        "timeline": timeline,
    }


def _build_timeline(resultat) -> list:
    decision = resultat.decision.value if hasattr(resultat.decision, 'value') else str(resultat.decision)
    is_retained = decision == "RETAINED"
    is_refused = decision == "REFUSED"
    has_decision = is_retained or is_refused

    return [
        {
            "statut": "POSTULE",
            "label": "Candidature envoyée",
            "description": "Votre dossier a bien été reçu par RANDA",
            "date": resultat.date_analyse.isoformat() if resultat.date_analyse else None,
            "done": True,
            "active": False,
            "color": "#52C41A",
        },
        {
            "statut": "ANALYSE",
            "label": "Analyse IA",
            "description": "Votre CV a été analysé et comparé à l'offre",
            "date": resultat.date_analyse.isoformat() if resultat.date_analyse else None,
            "done": (resultat.score_final or 0) > 0,
            "active": (resultat.score_final or 0) == 0,
            "color": "#1677ff",
        },
        {
            "statut": "EN_EXAMEN",
            "label": "En cours d'examen",
            "description": "Votre profil est examiné par l'équipe RH",
            "date": None,
            "done": has_decision,
            "active": not has_decision and (resultat.score_final or 0) > 0,
            "color": "#C9A84C",
        },
        {
            "statut": "DECISION",
            "label": "Retenu ✅" if is_retained else ("Refusé ❌" if is_refused else "Décision en attente"),
            "description": (
                "Félicitations ! Votre candidature a été retenue." if is_retained
                else "Votre candidature n'a pas été retenue pour ce poste." if is_refused
                else "L'équipe RH prendra sa décision prochainement."
            ),
            "date": resultat.date_decision.isoformat() if resultat.date_decision else None,
            "done": has_decision,
            "active": False,
            "color": "#52C41A" if is_retained else ("#FF4D4F" if is_refused else "#D9D9D9"),
        },
    ]


@router.delete("/applications/{application_id}", status_code=200)
async def delete_application(
    application_id: int,
    candidate=Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    """Retirer une candidature (uniquement si statut PENDING)."""
    return await application_service.delete_application(db, application_id, candidate)
