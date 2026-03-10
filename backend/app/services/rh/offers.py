from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.core.database import get_db
from app.api.dependencies import require_rh
from app.models.schemas.rh_schemas import (
    OfferCreateIn, OfferUpdateIn, OfferOut, OfferListOut
)
from app.services.rh import offer_service

router = APIRouter(
    prefix="/api/rh",
    tags=["💼 RH — Offres d'emploi"],
)

@router.get("/offers", response_model=OfferListOut)
async def list_offers(
    statut:    Optional[str] = Query(None),
    page:      int           = Query(1, ge=1),
    limit:     int           = Query(20, ge=1, le=100),
    rh        = Depends(require_rh),
    db: AsyncSession = Depends(get_db)
):
    return await offer_service.list_rh_offers(
        db, rh.id, statut, page, limit
    )

@router.post("/offers", response_model=OfferOut, status_code=201)
async def create_offer(
    data: OfferCreateIn,
    rh        = Depends(require_rh),
    db: AsyncSession = Depends(get_db)
):
    return await offer_service.create_offer(db, data, rh.id)

@router.get("/offers/{offer_id}", response_model=OfferOut)
async def get_offer(
    offer_id: int,
    rh        = Depends(require_rh),
    db: AsyncSession = Depends(get_db)
):
    return await offer_service.get_offer(db, offer_id)

@router.put("/offers/{offer_id}", response_model=OfferOut)
async def update_offer(
    offer_id: int,
    data: OfferUpdateIn,
    rh        = Depends(require_rh),
    db: AsyncSession = Depends(get_db)
):
    return await offer_service.update_offer(db, offer_id, data, rh.id)

@router.delete("/offers/{offer_id}", response_model=OfferOut)
async def archive_offer(
    offer_id: int,
    rh        = Depends(require_rh),
    db: AsyncSession = Depends(get_db)
):
    return await offer_service.archive_offer(db, offer_id, rh.id)