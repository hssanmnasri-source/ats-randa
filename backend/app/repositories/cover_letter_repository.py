from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.db_models import CoverLetter
from typing import Optional


async def list_by_candidate(
    db: AsyncSession,
    candidate_id: int,
    skip: int = 0,
    limit: int = 50,
) -> tuple[int, list[CoverLetter]]:
    query = select(CoverLetter).where(CoverLetter.id_candidate == candidate_id)
    total = await db.scalar(select(func.count()).select_from(query.subquery()))
    query = query.order_by(CoverLetter.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return total, result.scalars().all()


async def get_by_id(
    db: AsyncSession, cover_letter_id: int, candidate_id: int
) -> Optional[CoverLetter]:
    result = await db.execute(
        select(CoverLetter).where(
            CoverLetter.id == cover_letter_id,
            CoverLetter.id_candidate == candidate_id,
        )
    )
    return result.scalar_one_or_none()


async def create(db: AsyncSession, candidate_id: int, data: dict) -> CoverLetter:
    cl = CoverLetter(id_candidate=candidate_id, **data)
    db.add(cl)
    await db.commit()
    await db.refresh(cl)
    return cl


async def update(db: AsyncSession, cl: CoverLetter, data: dict) -> CoverLetter:
    for key, value in data.items():
        setattr(cl, key, value)
    await db.commit()
    await db.refresh(cl)
    return cl


async def delete(db: AsyncSession, cl: CoverLetter) -> None:
    await db.delete(cl)
    await db.commit()
