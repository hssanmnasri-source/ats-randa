"""
result_repository.py
Accès base de données pour la table resultats.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from app.models.db_models import Resultat, Decision


async def create_many(db: AsyncSession, rows: list[dict]) -> None:
    """Insère plusieurs résultats en une seule transaction."""
    for row in rows:
        db.add(Resultat(**row))
    await db.commit()


async def list_by_offer(
    db: AsyncSession,
    offer_id: int,
    decision: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> tuple[int, list[Resultat]]:
    query = select(Resultat).where(Resultat.id_offre == offer_id)

    if decision:
        query = query.where(Resultat.decision == decision)

    total = await db.scalar(
        select(func.count()).select_from(query.subquery())
    )
    rows = await db.execute(
        query.order_by(Resultat.rang).offset(skip).limit(limit)
    )
    return total, rows.scalars().all()


async def get_by_id(db: AsyncSession, result_id: int) -> Resultat | None:
    r = await db.execute(select(Resultat).where(Resultat.id == result_id))
    return r.scalar_one_or_none()


async def update_decision(
    db: AsyncSession,
    result: Resultat,
    decision: Decision,
) -> Resultat:
    result.decision = decision
    await db.commit()
    await db.refresh(result)
    return result


async def delete_by_offer(db: AsyncSession, offer_id: int) -> int:
    """Supprime tous les résultats d'une offre (avant re-matching)."""
    r = await db.execute(
        delete(Resultat).where(Resultat.id_offre == offer_id)
    )
    await db.commit()
    return r.rowcount
