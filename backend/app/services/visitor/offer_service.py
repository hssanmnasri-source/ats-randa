from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import offer_repository


def _enrich(offer, nb_candidatures: int) -> dict:
    pub_date = offer.date_publication
    if pub_date and pub_date.tzinfo is None:
        pub_date = pub_date.replace(tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    is_new = (now - pub_date).days < 7 if pub_date else False
    ville = (offer.details or {}).get("ville") if offer.details else None
    return {
        "id": offer.id,
        "titre": offer.titre,
        "description": offer.description,
        "competences_requises": offer.competences_requises or [],
        "experience_requise": offer.experience_requise or 0.0,
        "langue_requise": offer.langue_requise or "fr",
        "date_publication": offer.date_publication,
        "plateforme_source": offer.plateforme_source or "randa",
        "nb_candidatures": nb_candidatures,
        "is_new": is_new,
        "ville": ville,
    }


async def list_active_offers(
    db: AsyncSession,
    search: Optional[str],
    experience_min: Optional[float],
    langue: Optional[str],
    page: int,
    limit: int,
) -> dict:
    skip = (page - 1) * limit
    total, offers = await offer_repository.list_active_search(
        db,
        search=search,
        experience_min=experience_min,
        langue=langue,
        skip=skip,
        limit=limit,
    )

    offer_ids = [o.id for o in offers]
    counts = await offer_repository.count_candidatures_batch(db, offer_ids)

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "offers": [_enrich(o, counts.get(o.id, 0)) for o in offers],
    }


async def get_active_offer(
    db: AsyncSession,
    offer_id: int,
    candidate_id: Optional[int] = None,
) -> dict:
    offer = await offer_repository.get_active_by_id(db, offer_id)
    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Offre introuvable ou inactive",
        )

    similar = await offer_repository.list_similar(
        db, offer_id, offer.langue_requise or "fr", limit=3
    )

    all_ids = [offer.id] + [o.id for o in similar]
    counts = await offer_repository.count_candidatures_batch(db, all_ids)

    result = _enrich(offer, counts.get(offer.id, 0))
    result["offres_similaires"] = [_enrich(o, counts.get(o.id, 0)) for o in similar]

    mon_score = None
    if candidate_id is not None:
        mon_score = await offer_repository.get_candidate_score(db, offer_id, candidate_id)
    result["mon_score_matching"] = mon_score

    return result
