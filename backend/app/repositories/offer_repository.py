from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.db_models import JobOffer, OfferStatus
from typing import Optional

async def create(db: AsyncSession, data: dict) -> JobOffer:
    offer = JobOffer(**data)
    db.add(offer)
    await db.commit()
    await db.refresh(offer)
    return offer

async def get_by_id(db: AsyncSession, offer_id: int) -> JobOffer | None:
    result = await db.execute(
        select(JobOffer).where(JobOffer.id == offer_id)
    )
    return result.scalar_one_or_none()

async def update(db: AsyncSession, offer: JobOffer, data: dict) -> JobOffer:
    for key, value in data.items():
        if value is not None:
            setattr(offer, key, value)
    await db.commit()
    await db.refresh(offer)
    return offer

async def archive(db: AsyncSession, offer: JobOffer) -> JobOffer:
    offer.statut = OfferStatus.ARCHIVED
    await db.commit()
    await db.refresh(offer)
    return offer

async def list_by_rh(
    db: AsyncSession,
    rh_id: int,
    statut: Optional[str] = None,
    skip: int = 0,
    limit: int = 20
) -> tuple[int, list[JobOffer]]:
    query = select(JobOffer).where(JobOffer.id_rh == rh_id)

    if statut:
        query = query.where(JobOffer.statut == statut)

    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)

    query = query.offset(skip).limit(limit).order_by(JobOffer.date_publication.desc())
    result = await db.execute(query)
    return total, result.scalars().all()

async def list_active(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 20
) -> tuple[int, list[JobOffer]]:
    query = select(JobOffer).where(JobOffer.statut == OfferStatus.ACTIVE)

    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)

    query = query.offset(skip).limit(limit).order_by(JobOffer.date_publication.desc())
    result = await db.execute(query)
    return total, result.scalars().all()