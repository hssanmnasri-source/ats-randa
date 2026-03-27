from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from app.models.db_models import JobOffer, OfferStatus, Resultat
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

async def list_active_search(
    db: AsyncSession,
    search: Optional[str] = None,
    experience_min: Optional[float] = None,
    langue: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
) -> tuple[int, list[JobOffer]]:
    query = select(JobOffer).where(JobOffer.statut == OfferStatus.ACTIVE)

    if search:
        query = query.where(
            or_(
                JobOffer.titre.ilike(f"%{search}%"),
                JobOffer.description.ilike(f"%{search}%"),
            )
        )
    if experience_min is not None:
        query = query.where(JobOffer.experience_requise >= experience_min)
    if langue:
        query = query.where(JobOffer.langue_requise == langue)

    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)

    query = query.offset(skip).limit(limit).order_by(JobOffer.date_publication.desc())
    result = await db.execute(query)
    return total, result.scalars().all()


async def list_similar(
    db: AsyncSession,
    offer_id: int,
    langue: str,
    limit: int = 3,
) -> list[JobOffer]:
    result = await db.execute(
        select(JobOffer)
        .where(
            JobOffer.statut == OfferStatus.ACTIVE,
            JobOffer.id != offer_id,
            JobOffer.langue_requise == langue,
        )
        .order_by(JobOffer.date_publication.desc())
        .limit(limit)
    )
    return result.scalars().all()


async def count_candidatures_batch(
    db: AsyncSession,
    offer_ids: list[int],
) -> dict[int, int]:
    if not offer_ids:
        return {}
    result = await db.execute(
        select(Resultat.id_offre, func.count(Resultat.id))
        .where(Resultat.id_offre.in_(offer_ids))
        .group_by(Resultat.id_offre)
    )
    return {row[0]: row[1] for row in result}


async def get_candidate_score(
    db: AsyncSession,
    offer_id: int,
    candidate_id: int,
) -> Optional[float]:
    from app.models.db_models import CV, CVStatus
    cv_result = await db.execute(
        select(CV)
        .where(CV.id_candidate == candidate_id, CV.statut == CVStatus.INDEXED)
        .order_by(CV.cv_version.desc())
        .limit(1)
    )
    cv = cv_result.scalar_one_or_none()
    if not cv:
        return None
    score_result = await db.execute(
        select(Resultat.score_final)
        .where(Resultat.id_cv == cv.id, Resultat.id_offre == offer_id)
    )
    return score_result.scalar_one_or_none()

async def get_active_by_id(
    db: AsyncSession,
    offer_id: int
) -> JobOffer | None:
    result = await db.execute(
        select(JobOffer).where(
            JobOffer.id == offer_id,
            JobOffer.statut == OfferStatus.ACTIVE
        )
    )
    return result.scalar_one_or_none()