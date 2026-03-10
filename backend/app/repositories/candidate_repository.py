from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.db_models import Candidate

async def get_by_email(db: AsyncSession, email: str) -> Candidate | None:
    result = await db.execute(
        select(Candidate).where(Candidate.email == email)
    )
    return result.scalar_one_or_none()

async def get_by_id(db: AsyncSession, candidate_id: int) -> Candidate | None:
    result = await db.execute(
        select(Candidate).where(Candidate.id == candidate_id)
    )
    return result.scalar_one_or_none()

async def create(db: AsyncSession, data: dict) -> Candidate:
    candidate = Candidate(**data)
    db.add(candidate)
    await db.commit()
    await db.refresh(candidate)
    return candidate

async def update(db: AsyncSession, candidate: Candidate, data: dict) -> Candidate:
    for key, value in data.items():
        if value is not None:
            setattr(candidate, key, value)
    await db.commit()
    await db.refresh(candidate)
    return candidate