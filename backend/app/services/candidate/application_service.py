"""
services/candidate/application_service.py
Logique métier pour les candidatures.
"""
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.db_models import CV, Resultat, JobOffer, Decision, OfferStatus
from app.repositories import candidate_repository


async def _get_candidate_id(db: AsyncSession, user) -> int:
    candidate = await candidate_repository.get_by_email(db, user.email)
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profil candidat introuvable — veuillez compléter votre profil",
        )
    return candidate.id


async def apply_to_offer(db: AsyncSession, offer_id: int, user) -> dict:
    """Postuler à une offre — vérifie l'offre, le CV et les doublons."""
    offer = await db.get(JobOffer, offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail="Offre introuvable")
    if offer.statut != OfferStatus.ACTIVE:
        raise HTTPException(
            status_code=400,
            detail="Cette offre n'est plus active et n'accepte plus de candidatures",
        )

    candidate_id = await _get_candidate_id(db, user)

    res = await db.execute(
        select(CV)
        .where(CV.id_candidate == candidate_id)
        .order_by(CV.date_depot.desc())
        .limit(1)
    )
    cv = res.scalar_one_or_none()
    if not cv:
        raise HTTPException(
            status_code=400,
            detail={
                "error":   "cv_required",
                "message": "Veuillez d'abord créer votre CV (upload ou formulaire) avant de postuler",
            },
        )

    existing = await db.execute(
        select(Resultat).where(
            Resultat.id_cv == cv.id,
            Resultat.id_offre == offer_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Vous avez déjà postulé à cette offre")

    application = Resultat(
        id_cv=cv.id,
        id_offre=offer_id,
        score_matching=0.0,
        score_skills=0.0,
        score_experience=0.0,
        score_langue=0.0,
        score_final=0.0,
        rang=None,
        decision=Decision.PENDING,
    )
    db.add(application)
    await db.commit()
    await db.refresh(application)

    return {
        "success":          True,
        "application_id":   application.id,
        "id_offre":         offer_id,
        "titre_offre":      offer.titre,
        "decision":         application.decision.value,
        "date_candidature": application.date_analyse.isoformat(),
    }


async def list_applications(db: AsyncSession, user, page: int, limit: int) -> dict:
    """Liste toutes les candidatures du candidat connecté."""
    from sqlalchemy.orm import selectinload

    candidate_id = await _get_candidate_id(db, user)

    cv_ids_q = await db.execute(select(CV.id).where(CV.id_candidate == candidate_id))
    cv_ids = [r for (r,) in cv_ids_q.fetchall()]
    if not cv_ids:
        return {"total": 0, "candidatures": []}

    query = (
        select(Resultat)
        .options(selectinload(Resultat.offre))
        .where(Resultat.id_cv.in_(cv_ids))
        .order_by(Resultat.date_analyse.desc())
    )

    total = await db.scalar(select(func.count()).select_from(query.subquery()))
    skip  = (page - 1) * limit
    rows  = await db.execute(query.offset(skip).limit(limit))
    resultats = rows.scalars().all()

    candidatures = []
    for r in resultats:
        offre_data = None
        if r.offre:
            offre_data = {
                "id":               r.offre.id,
                "titre":            r.offre.titre,
                "description":      r.offre.description,
                "date_publication": r.offre.date_publication.isoformat() if r.offre.date_publication else None,
                "statut":           r.offre.statut.value if r.offre.statut else None,
            }
        candidatures.append({
            "id":               r.id,
            "id_offre":         r.id_offre,
            "id_cv":            r.id_cv,
            "score_final":      r.score_final,
            "decision":         r.decision.value if r.decision else "PENDING",
            "date_candidature": r.date_analyse.isoformat() if r.date_analyse else None,
            "offre":            offre_data,
        })

    return {"total": total, "candidatures": candidatures}


async def delete_application(db: AsyncSession, application_id: int, user) -> dict:
    """Retirer une candidature (uniquement si statut PENDING)."""
    candidate_id = await _get_candidate_id(db, user)

    application = await db.get(Resultat, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Candidature introuvable")

    cv = await db.get(CV, application.id_cv)
    if not cv or cv.id_candidate != candidate_id:
        raise HTTPException(status_code=403, detail="Accès refusé")

    if application.decision != Decision.PENDING:
        raise HTTPException(
            status_code=400,
            detail="Impossible de retirer une candidature déjà traitée (RETAINED ou REFUSED)",
        )

    await db.delete(application)
    await db.commit()
    return {"success": True, "message": "Candidature retirée avec succès"}
