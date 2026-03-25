"""
api/routes/candidate/cover_letters.py
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.dependencies import require_candidate
from app.models.schemas.candidate_schemas import (
    CoverLetterIn,
    CoverLetterOut,
    CoverLetterListOut,
)
from app.services.candidate import cover_letter_service

router = APIRouter(
    prefix="/api/candidate",
    tags=["👤 Candidat — Lettres de motivation"],
)


@router.get("/cover-letters", response_model=CoverLetterListOut)
async def list_cover_letters(
    candidate=Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    """Liste mes lettres de motivation."""
    return await cover_letter_service.list_cover_letters(db, candidate)


@router.post("/cover-letters", response_model=CoverLetterOut, status_code=201)
async def create_cover_letter(
    data: CoverLetterIn,
    candidate=Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    """Crée une nouvelle lettre de motivation."""
    return await cover_letter_service.create_cover_letter(db, candidate, data)


@router.put("/cover-letters/{cl_id}", response_model=CoverLetterOut)
async def update_cover_letter(
    cl_id: int,
    data: CoverLetterIn,
    candidate=Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    """Modifie une lettre de motivation."""
    return await cover_letter_service.update_cover_letter(db, candidate, cl_id, data)


@router.delete("/cover-letters/{cl_id}", status_code=200)
async def delete_cover_letter(
    cl_id: int,
    candidate=Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    """Supprime une lettre de motivation."""
    await cover_letter_service.delete_cover_letter(db, candidate, cl_id)
    return {"message": "Lettre supprimée"}
