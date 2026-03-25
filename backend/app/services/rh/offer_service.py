from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.repositories import offer_repository
from typing import Optional

_DETAIL_FIELDS = [
    'reference_interne', 'type_poste', 'disponibilite',
    'salaire_min', 'salaire_max', 'salaire_periode',
    'niveau_etude', 'niveau_experience', 'langues', 'permis', 'metiers',
    'pays', 'region', 'ville', 'mobilite_locale', 'mobilite_internationale',
    'anonyme', 'url_externe', 'notification_email', 'email_responsable',
]


def _pack_details(data) -> dict:
    details = {}
    for field in _DETAIL_FIELDS:
        val = getattr(data, field, None)
        if val is not None:
            details[field] = val
    return details or None


async def create_offer(db: AsyncSession, data, rh_id: int):
    offer = await offer_repository.create(db, {
        "titre":                data.titre,
        "description":          data.description,
        "competences_requises": data.competences_requises,
        "experience_requise":   data.experience_requise,
        "langue_requise":       data.langue_requise,
        "plateforme_source":    "randa",
        "id_rh":                rh_id,
        "details":              _pack_details(data),
    })
    return offer


async def update_offer(db: AsyncSession, offer_id: int, data, rh_id: int):
    offer = await _get_or_404(db, offer_id)
    _check_owner(offer, rh_id)

    # Core fields
    core_update = data.model_dump(
        exclude_unset=True,
        include={'titre', 'description', 'competences_requises', 'experience_requise', 'langue_requise'}
    )
    # Merge new details over existing
    new_details = _pack_details(data)
    if new_details is not None:
        existing = offer.details or {}
        core_update['details'] = {**existing, **new_details}

    return await offer_repository.update(db, offer, core_update)


async def archive_offer(db: AsyncSession, offer_id: int, rh_id: int):
    offer = await _get_or_404(db, offer_id)
    _check_owner(offer, rh_id)
    return await offer_repository.archive(db, offer)


async def get_offer(db: AsyncSession, offer_id: int):
    return await _get_or_404(db, offer_id)


async def list_rh_offers(
    db: AsyncSession,
    rh_id: int,
    statut: Optional[str] = None,
    page: int = 1,
    limit: int = 20
):
    skip = (page - 1) * limit
    total, offers = await offer_repository.list_by_rh(
        db, rh_id, statut, skip, limit
    )
    return {"total": total, "offers": offers}


async def list_public_offers(
    db: AsyncSession,
    page: int = 1,
    limit: int = 20
):
    skip = (page - 1) * limit
    total, offers = await offer_repository.list_active(db, skip, limit)
    return {"total": total, "offers": offers}


# ── Helpers ───────────────────────────────────────
async def _get_or_404(db, offer_id):
    offer = await offer_repository.get_by_id(db, offer_id)
    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Offre introuvable"
        )
    return offer


def _check_owner(offer, rh_id):
    if offer.id_rh != rh_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'êtes pas propriétaire de cette offre"
        )
