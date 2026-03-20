"""
api/routes/candidate/applications.py
Routes de candidature pour l'espace candidat.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.dependencies import require_candidate
from app.services.candidate import application_service

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


@router.delete("/applications/{application_id}", status_code=200)
async def delete_application(
    application_id: int,
    candidate=Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    """Retirer une candidature (uniquement si statut PENDING)."""
    return await application_service.delete_application(db, application_id, candidate)
