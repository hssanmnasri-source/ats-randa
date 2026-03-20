"""
api/routes/candidate/cvs.py
Routes CV pour l'espace candidat.
"""
from fastapi import APIRouter, Depends, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.dependencies import require_candidate
from app.models.schemas.candidate_schemas import CVOut, CVListOut, ResultatListOut, CVFormIn
from app.services.candidate import cv_service

router = APIRouter(
    prefix="/api/candidate",
    tags=["👤 Candidat — CVs & Candidatures"],
)


@router.post("/cvs/upload", response_model=CVOut, status_code=201)
async def upload_cv(
    file: UploadFile = File(...),
    candidate=Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload un fichier CV.

    - **Formats acceptés** : PDF, DOCX, JPG, PNG
    - **Taille max** : 5 MB
    - Le CV est lié à votre profil automatiquement
    """
    return await cv_service.upload_cv(db, file, candidate)


@router.post("/cvs/form", response_model=CVOut, status_code=201)
async def create_cv_from_form(
    data: CVFormIn,
    candidate=Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    """
    Créer un CV en ligne via formulaire (sans fichier).

    **Champs obligatoires :**
    - `titre_poste` — poste souhaité
    - `resume` — résumé (≥ 50 caractères)
    - `experience_annees` — années d'expérience (0–50)
    - `niveau_etude` — BAC / BAC+2 / BAC+3 / BAC+5 / Doctorat
    - `competences` — liste (≥ 1 compétence)
    """
    return await cv_service.create_cv_from_form(db, data, candidate)


@router.get("/cvs", response_model=CVListOut)
async def list_cvs(
    page:  int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    candidate=Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    """Liste mes CVs déposés."""
    return await cv_service.list_cvs(db, candidate, page, limit)


@router.get("/cvs/{cv_id}", response_model=CVOut)
async def get_cv(
    cv_id: int,
    candidate=Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    """Détail d'un CV (uniquement les miens)."""
    return await cv_service.get_cv(db, cv_id, candidate)


@router.get("/candidatures", response_model=ResultatListOut)
async def list_candidatures(
    page:  int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    candidate=Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    """Mes candidatures avec scores et décisions RH."""
    return await cv_service.list_candidatures(db, candidate, page, limit)
