"""
matching.py
Routes RH pour le matching CV ↔ Offre.

POST /api/rh/offers/{id}/matching        → lance le matching, retourne top N
GET  /api/rh/offers/{id}/matching        → résultats stockés (paginés)
PATCH /api/rh/offers/{id}/matching/{rid} → mettre à jour la décision
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db, require_rh
from app.models.db_models import Decision
from app.services.rh.matching_service import run_matching
from app.services.rh.pdf_export import generate_matching_pdf
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
        await run_matching(db, offer_id, top_n=top_n, force=force)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    total, rows = await result_repository.list_by_offer(db, offer_id, limit=top_n)
    return {
        "offer_id":  offer_id,
        "titre":     offer.titre,
        "total":     total,
        "resultats": rows,
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
        "resultats": rows,
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

    # Notification email pour RETAINED / REFUSED (fire-and-forget)
    if decision_str in ("RETAINED", "REFUSED"):
        import asyncio
        from app.models.db_models import CV, Candidate
        from app.core.mailer import send_decision_notification
        cv = await db.get(CV, result.id_cv)
        if cv:
            candidate = await db.get(Candidate, cv.id_candidate)
            offer_obj = await offer_repository.get_by_id(db, offer_id)
            if candidate and candidate.email and offer_obj:
                asyncio.create_task(send_decision_notification(
                    candidate.email,
                    candidate.nom or "",
                    candidate.prenom or "",
                    offer_obj.titre,
                    decision_str,
                ))

    return {
        "id":       updated.id,
        "decision": updated.decision.value,
        "rang":     updated.rang,
        "score_final": updated.score_final,
    }


@router.get("/{offer_id}/export/pdf", status_code=200)
async def export_matching_pdf(
    offer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_rh),
):
    """
    Génère et retourne le rapport PDF de matching pour une offre.
    Inclut tous les candidats analysés, classés par rang.
    """
    offer = await offer_repository.get_by_id(db, offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail=f"Offre #{offer_id} introuvable")

    _, results = await result_repository.list_by_offer(db, offer_id, limit=500)

    try:
        pdf_bytes = generate_matching_pdf(offer, results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur génération PDF : {e}")

    safe_title = "".join(c if c.isalnum() or c in "-_" else "_" for c in offer.titre[:50])
    filename = f"matching_{offer_id}_{safe_title}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
