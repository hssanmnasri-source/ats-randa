from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.repositories import offer_repository
from typing import Optional


async def list_active_offers(
    db: AsyncSession,
    search: Optional[str],
    page: int,
    limit: int
) -> dict:
    skip = (page - 1) * limit
    total, offers = await offer_repository.list_active_search(
        db, search=search, skip=skip, limit=limit
    )
    return {
        "total": total,
        "page":  page,
        "limit": limit,
        "offers": offers,
    }


async def get_active_offer(db: AsyncSession, offer_id: int):
    offer = await offer_repository.get_active_by_id(db, offer_id)
    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Offre introuvable ou inactive"
        )
    return offer
