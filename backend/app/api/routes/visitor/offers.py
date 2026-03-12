from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.core.database import get_db
from app.models.schemas.visitor_schemas import PublicOfferOut, PublicOfferListOut
from app.services.visitor import offer_service

router = APIRouter(prefix="/api/visitor", tags=["📋 Visiteur — Offres"])


@router.get("/offers", response_model=PublicOfferListOut)
async def list_offers(
    search: Optional[str] = Query(None, description="Recherche par titre"),
    page:   int           = Query(1,    ge=1),
    limit:  int           = Query(20,   ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    return await offer_service.list_active_offers(db, search, page, limit)


@router.get("/offers/{offer_id}", response_model=PublicOfferOut)
async def get_offer(
    offer_id: int,
    db: AsyncSession = Depends(get_db)
):
    return await offer_service.get_active_offer(db, offer_id)
