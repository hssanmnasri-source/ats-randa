from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.core.database import get_db
from app.models.schemas.visitor_schemas import (
    PublicOfferDetailOut,
    PublicOfferListOut,
)
from app.services.visitor import offer_service
from app.api.dependencies import get_optional_user

router = APIRouter(prefix="/api/visitor", tags=["📋 Visiteur — Offres"])


@router.get("/offers", response_model=PublicOfferListOut)
async def list_offers(
    search:         Optional[str]   = Query(None, description="Recherche par titre ou description"),
    experience_min: Optional[float] = Query(None, ge=0, description="Expérience minimale (années)"),
    langue:         Optional[str]   = Query(None, description="Langue requise (fr, en, ar)"),
    page:           int             = Query(1,    ge=1),
    limit:          int             = Query(20,   ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    return await offer_service.list_active_offers(db, search, experience_min, langue, page, limit)


@router.get("/offers/{offer_id}", response_model=PublicOfferDetailOut)
async def get_offer(
    offer_id: int,
    db:       AsyncSession = Depends(get_db),
    user                   = Depends(get_optional_user),
):
    candidate_id = None
    if user and user.role.value == "CANDIDATE":
        from app.repositories.candidate_repository import get_by_email
        candidate = await get_by_email(db, user.email)
        if candidate:
            candidate_id = candidate.id

    return await offer_service.get_active_offer(db, offer_id, candidate_id)
