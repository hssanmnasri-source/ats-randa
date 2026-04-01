from fastapi import APIRouter, Depends, Query, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from app.core.database import get_db
from app.api.dependencies import require_rh
from app.models.schemas.rh_schemas import (
    OfferCreateIn, OfferUpdateIn, OfferOut, OfferListOut
)
from app.models.db_models import JobOffer
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


@router.put("/offers/{offer_id}/seuil")
async def set_seuil_alerte(
    offer_id: int,
    seuil: int = Body(..., ge=1, le=10000, embed=True),
    matching_auto: bool = Body(False, embed=True),
    rh=Depends(require_rh),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(JobOffer).where(JobOffer.id == offer_id, JobOffer.id_rh == rh.id)
    )
    offer = result.scalar_one_or_none()
    if not offer:
        raise HTTPException(404, "Offre introuvable")
    offer.seuil_alerte = seuil
    offer.matching_auto = matching_auto
    offer.alerte_envoyee = False
    await db.commit()
    return {"offre_id": offer_id, "seuil_alerte": seuil, "matching_auto": matching_auto}


@router.post("/offers/{offer_id}/reset-alerte")
async def reset_alerte(
    offer_id: int,
    rh=Depends(require_rh),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(JobOffer).where(JobOffer.id == offer_id, JobOffer.id_rh == rh.id)
    )
    offer = result.scalar_one_or_none()
    if not offer:
        raise HTTPException(404, "Offre introuvable")
    offer.alerte_envoyee = False
    await db.commit()
    return {"message": "Alerte reinitialisee"}