"""
services/candidate/profile_service.py
Logique métier pour le profil candidat.
"""
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import candidate_repository
from app.models.schemas.candidate_schemas import CandidateProfileUpdateIn


async def get_profile(db: AsyncSession, user) -> dict:
    """Retourne ou crée automatiquement le profil candidat."""
    candidate = await candidate_repository.get_by_email(db, user.email)
    if not candidate:
        candidate = await candidate_repository.create(db, {
            "nom":    getattr(user, "nom",    None),
            "prenom": getattr(user, "prenom", None),
            "email":  user.email,
        })
    return candidate


async def update_profile(db: AsyncSession, user, data: CandidateProfileUpdateIn) -> dict:
    """Met à jour les informations du profil candidat."""
    candidate = await candidate_repository.get_by_email(db, user.email)
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profil candidat introuvable",
        )
    updates = {k: v for k, v in data.model_dump(exclude_none=True).items()}
    if not updates:
        return candidate
    return await candidate_repository.update(db, candidate, updates)
