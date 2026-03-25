"""
services/candidate/cover_letter_service.py
"""
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import candidate_repository
from app.repositories import cover_letter_repository
from app.models.schemas.candidate_schemas import CoverLetterIn


async def _get_candidate(db, user):
    c = await candidate_repository.get_by_email(db, user.email)
    if not c:
        raise HTTPException(status_code=404, detail="Profil candidat introuvable")
    return c


async def list_cover_letters(db: AsyncSession, user):
    candidate = await _get_candidate(db, user)
    total, items = await cover_letter_repository.list_by_candidate(db, candidate.id)
    return {"total": total, "cover_letters": items}


async def create_cover_letter(db: AsyncSession, user, data: CoverLetterIn):
    candidate = await _get_candidate(db, user)
    return await cover_letter_repository.create(
        db, candidate.id, data.model_dump()
    )


async def update_cover_letter(db: AsyncSession, user, cl_id: int, data: CoverLetterIn):
    candidate = await _get_candidate(db, user)
    cl = await cover_letter_repository.get_by_id(db, cl_id, candidate.id)
    if not cl:
        raise HTTPException(status_code=404, detail="Lettre de motivation introuvable")
    return await cover_letter_repository.update(db, cl, data.model_dump())


async def delete_cover_letter(db: AsyncSession, user, cl_id: int) -> None:
    candidate = await _get_candidate(db, user)
    cl = await cover_letter_repository.get_by_id(db, cl_id, candidate.id)
    if not cl:
        raise HTTPException(status_code=404, detail="Lettre de motivation introuvable")
    await cover_letter_repository.delete(db, cl)
