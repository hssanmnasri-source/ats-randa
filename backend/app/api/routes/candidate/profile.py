"""
api/routes/candidate/profile.py
Routes de gestion du profil candidat.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.dependencies import require_candidate
from app.models.schemas.candidate_schemas import CandidateProfileOut, CandidateProfileUpdateIn
from app.services.candidate import profile_service

router = APIRouter(
    prefix="/api/candidate",
    tags=["👤 Candidat — Profil"],
)


@router.get("/profile", response_model=CandidateProfileOut)
async def get_profile(
    candidate=Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    """Récupère mon profil (nom, prénom, email, téléphone, adresse…)."""
    return await profile_service.get_profile(db, candidate)


@router.put("/profile", response_model=CandidateProfileOut)
async def update_profile(
    data: CandidateProfileUpdateIn,
    candidate=Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    """Met à jour les informations de mon profil candidat."""
    return await profile_service.update_profile(db, candidate, data)
