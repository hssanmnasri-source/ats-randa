from fastapi import APIRouter, Depends, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.dependencies import require_candidate
from app.models.schemas.candidate_schemas import (
    CVOut, CVListOut, ResultatListOut
)
from app.services.candidate import cv_service

router = APIRouter(
    prefix="/api/candidate",
    tags=["👤 Candidat — CVs & Candidatures"],
)

@router.post("/cvs/upload", response_model=CVOut, status_code=201)
async def upload_cv(
    file: UploadFile = File(...),
    candidate = Depends(require_candidate),
    db: AsyncSession = Depends(get_db)
):
    return await cv_service.upload_cv(db, file, candidate)

@router.get("/cvs", response_model=CVListOut)
async def list_cvs(
    page:  int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    candidate = Depends(require_candidate),
    db: AsyncSession = Depends(get_db)
):
    return await cv_service.list_cvs(db, candidate, page, limit)

@router.get("/cvs/{cv_id}", response_model=CVOut)
async def get_cv(
    cv_id: int,
    candidate = Depends(require_candidate),
    db: AsyncSession = Depends(get_db)
):
    return await cv_service.get_cv(db, cv_id, candidate)

@router.get("/candidatures", response_model=ResultatListOut)
async def list_candidatures(
    page:  int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    candidate = Depends(require_candidate),
    db: AsyncSession = Depends(get_db)
):
    return await cv_service.list_candidatures(db, candidate, page, limit)