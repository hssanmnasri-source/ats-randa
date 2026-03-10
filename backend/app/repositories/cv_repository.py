from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.db_models import CV, CVStatus, Resultat
from typing import Optional

async def create(db: AsyncSession, data: dict) -> CV:
    cv = CV(**data)
    db.add(cv)
    await db.commit()
    await db.refresh(cv)
    return cv

async def get_by_id(db: AsyncSession, cv_id: int) -> CV | None:
    result = await db.execute(
        select(CV).where(CV.id == cv_id)
    )
    return result.scalar_one_or_none()

async def update(db: AsyncSession, cv: CV, data: dict) -> CV:
    for key, value in data.items():
        setattr(cv, key, value)
    await db.commit()
    await db.refresh(cv)
    return cv

async def list_by_candidate(
    db: AsyncSession,
    candidate_id: int,
    skip: int = 0,
    limit: int = 20
) -> tuple[int, list[CV]]:
    query = select(CV).where(CV.id_candidate == candidate_id)

    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)

    query = query.offset(skip).limit(limit).order_by(CV.date_depot.desc())
    result = await db.execute(query)
    return total, result.scalars().all()

async def list_resultats(
    db: AsyncSession,
    candidate_id: int,
    skip: int = 0,
    limit: int = 20
) -> tuple[int, list[Resultat]]:
    # Jointure CV → Resultat pour ce candidat
    query = (
        select(Resultat)
        .join(CV, Resultat.id_cv == CV.id)
        .where(CV.id_candidate == candidate_id)
        .order_by(Resultat.date_analyse.desc())
    )

    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return total, result.scalars().all()