"""
matching.py
Routes RH pour le matching CV ↔ Offre.

POST /api/rh/offers/{id}/matching        → lance le matching, retourne top N
GET  /api/rh/offers/{id}/matching        → résultats stockés (paginés)
PATCH /api/rh/offers/{id}/matching/{rid} → mettre à jour la décision
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db, require_rh
from app.models.db_models import Decision
from app.services.rh.matching_service import run_matching
from app.repositories import result_repository, offer_repository

router = APIRouter(prefix="/api/rh/offers", tags=["🎯 RH — Matching"])


@router.post("/{offer_id}/matching", status_code=200)
async def launch_matching(
    offer_id: int,
    top_n: int = Query(default=50, ge=1, le=200, description="Nombre max de CVs retournés"),
    force: bool = Query(default=False, description="Relancer même si des résultats existent"),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_rh),
):
    """
    Lance le matching pour une offre.

    - Génère l'embedding de l'offre si absent
    - Interroge pgvector pour les CVs les plus proches (cosinus)
    - Applique le scoring multi-critères (sémantique + compétences + expérience + langue)
    - Stocke les résultats en DB et retourne le top N
    """
    offer = await offer_repository.get_by_id(db, offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail=f"Offre #{offer_id} introuvable")

    try:
        results = await run_matching(db, offer_id, top_n=top_n, force=force)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "offer_id":  offer_id,
        "titre":     offer.titre,
        "total":     len(results),
        "resultats": results,
    }


@router.get("/{offer_id}/matching", status_code=200)
async def get_matching_results(
    offer_id: int,
    decision: str | None = Query(default=None, description="Filtrer par décision : RETAINED / PENDING / REFUSED"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_rh),
):
    """
    Récupère les résultats de matching déjà calculés pour une offre.
    """
    offer = await offer_repository.get_by_id(db, offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail=f"Offre #{offer_id} introuvable")

    total, rows = await result_repository.list_by_offer(
        db, offer_id, decision=decision, skip=skip, limit=limit
    )

    return {
        "offer_id":  offer_id,
        "titre":     offer.titre,
        "total":     total,
        "skip":      skip,
        "limit":     limit,
        "resultats": [
            {
                "id":               r.id,
                "id_cv":            r.id_cv,
                "rang":             r.rang,
                "score_final":      r.score_final,
                "score_matching":   r.score_matching,
                "score_skills":     r.score_skills,
                "score_experience": r.score_experience,
                "score_langue":     r.score_langue,
                "decision":         r.decision.value if r.decision else "PENDING",
                "date_analyse":     r.date_analyse.isoformat() if r.date_analyse else None,
            }
            for r in rows
        ],
    }


@router.patch("/{offer_id}/matching/{result_id}", status_code=200)
async def update_decision(
    offer_id: int,
    result_id: int,
    body: dict,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_rh),
):
    """
    Met à jour la décision RH pour un résultat de matching.
    Body : { "decision": "RETAINED" | "PENDING" | "REFUSED" }
    """
    decision_str = (body.get("decision") or "").upper()
    if decision_str not in Decision.__members__:
        raise HTTPException(
            status_code=422,
            detail=f"Décision invalide '{decision_str}'. Valeurs acceptées : {list(Decision.__members__)}"
        )

    result = await result_repository.get_by_id(db, result_id)
    if not result or result.id_offre != offer_id:
        raise HTTPException(status_code=404, detail="Résultat introuvable")

    updated = await result_repository.update_decision(db, result, Decision[decision_str])
    return {
        "id":       updated.id,
        "decision": updated.decision.value,
        "rang":     updated.rang,
        "score_final": updated.score_final,
    }
