from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, exists
from app.models.db_models import Candidate, CV, CVSource
from typing import Optional


async def get_by_email(db: AsyncSession, email: str) -> Candidate | None:
    if not email:
        return None
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
        setattr(candidate, key, value)
    await db.commit()
    await db.refresh(candidate)
    return candidate


async def get_or_create(db: AsyncSession, data: dict) -> tuple:
    """Retourne (candidate, created: bool)"""
    if data.get("email"):
        existing = await get_by_email(db, data["email"])
        if existing:
            return existing, False
    candidate = await create(db, data)
    return candidate, True


async def list_all(
    db: AsyncSession,
    search: Optional[str] = None,
    agent_id: Optional[int] = None,   # si fourni → uniquement les candidats de cet agent
    skip: int = 0,
    limit: int = 20,
) -> tuple[int, list[Candidate]]:
    query = select(Candidate)

    if agent_id is not None:
        # Garder uniquement les candidats qui ont au moins un CV uploadé par cet agent
        query = query.where(
            exists(
                select(CV.id).where(
                    CV.id_candidate == Candidate.id,
                    CV.id_agent == agent_id,
                    CV.source == CVSource.AGENT,
                )
            )
        )

    if search:
        term = f"%{search}%"
        query = query.where(
            or_(
                Candidate.nom.ilike(term),
                Candidate.prenom.ilike(term),
                Candidate.email.ilike(term),
            )
        )

    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)

    query = query.offset(skip).limit(limit).order_by(Candidate.created_at.desc())
    result = await db.execute(query)
    return total, result.scalars().all()