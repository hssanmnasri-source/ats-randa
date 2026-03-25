from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.db_models import CandidateDocument
from typing import Optional


async def list_by_candidate(
    db: AsyncSession,
    candidate_id: int,
) -> tuple[int, list[CandidateDocument]]:
    query = select(CandidateDocument).where(CandidateDocument.id_candidate == candidate_id)
    total = await db.scalar(select(func.count()).select_from(query.subquery()))
    query = query.order_by(CandidateDocument.created_at.desc())
    result = await db.execute(query)
    return total, result.scalars().all()


async def get_by_id(
    db: AsyncSession, doc_id: int, candidate_id: int
) -> Optional[CandidateDocument]:
    result = await db.execute(
        select(CandidateDocument).where(
            CandidateDocument.id == doc_id,
            CandidateDocument.id_candidate == candidate_id,
        )
    )
    return result.scalar_one_or_none()


async def create(db: AsyncSession, candidate_id: int, data: dict) -> CandidateDocument:
    doc = CandidateDocument(id_candidate=candidate_id, **data)
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return doc


async def delete(db: AsyncSession, doc: CandidateDocument) -> None:
    await db.delete(doc)
    await db.commit()
