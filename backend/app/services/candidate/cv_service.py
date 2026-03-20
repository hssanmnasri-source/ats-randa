"""
services/candidate/cv_service.py
Service CV pour l'espace candidat.
"""
import os
import uuid

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import cv_repository, candidate_repository
from app.models.db_models import CVStatus, CVSource
from app.models.schemas.candidate_schemas import CVFormIn

UPLOAD_DIR = "/app/uploads/cvs"
MAX_SIZE   = 5 * 1024 * 1024   # 5 MB

ALLOWED_TYPES = {
    "application/pdf":  "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "image/jpeg": "jpg",
    "image/jpg":  "jpg",
    "image/png":  "png",
}


async def _get_or_create_candidate(db: AsyncSession, user) -> int:
    candidate = await candidate_repository.get_by_email(db, user.email)
    if not candidate:
        candidate = await candidate_repository.create(db, {
            "nom":    getattr(user, "nom",    None),
            "prenom": getattr(user, "prenom", None),
            "email":  user.email,
        })
    return candidate.id


async def upload_cv(db: AsyncSession, file: UploadFile, user) -> dict:
    """Upload CV fichier — PDF / DOCX / JPG / PNG, max 5 MB."""
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Format non supporté : '{file.content_type}'. "
                "Formats acceptés : PDF, DOCX, JPG, PNG"
            ),
        )

    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Fichier trop volumineux — maximum 5 MB (reçu : {len(content) // 1024} KB)",
        )

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext      = ALLOWED_TYPES[file.content_type]
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(content)

    candidate_id = await _get_or_create_candidate(db, user)

    cv = await cv_repository.create(db, {
        "id_candidate": candidate_id,
        "fichier_pdf":  filename,
        "source":       CVSource.CANDIDAT,
        "statut":       CVStatus.UPLOADED,
        "score_final":  0.0,
    })
    return cv


async def create_cv_from_form(db: AsyncSession, data: CVFormIn, user) -> dict:
    """Crée un CV depuis un formulaire en ligne (sans fichier)."""
    candidate_id = await _get_or_create_candidate(db, user)

    entities = {
        "titre_poste":       data.titre_poste,
        "resume":            data.resume,
        "experience_annees": data.experience_annees,
        "niveau_etude":      data.niveau_etude,
        "competences":       data.competences,
        "langues":           [l.model_dump() for l in (data.langues or [])],
        "telephone":         data.telephone,
        "adresse":           data.adresse,
        "disponibilite":     data.disponibilite,
        "salaire_souhaite":  data.salaire_souhaite,
    }

    cv = await cv_repository.create(db, {
        "id_candidate": candidate_id,
        "source":       CVSource.CANDIDAT,
        "statut":       CVStatus.INDEXED,
        "cv_entities":  entities,
        "score_final":  0.0,
    })

    competences_data = [{"nom_competence": c, "niveau": "INTERMEDIATE"} for c in data.competences]
    if competences_data:
        await cv_repository.add_competences(db, cv.id, competences_data)

    return cv


async def list_cvs(db: AsyncSession, user, page: int, limit: int) -> dict:
    candidate = await candidate_repository.get_by_email(db, user.email)
    if not candidate:
        return {"total": 0, "cvs": []}
    skip = (page - 1) * limit
    total, cvs = await cv_repository.list_by_candidate(db, candidate.id, skip, limit)
    return {"total": total, "cvs": cvs}


async def get_cv(db: AsyncSession, cv_id: int, user) -> dict:
    cv = await cv_repository.get_by_id(db, cv_id)
    if not cv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="CV introuvable")
    candidate = await candidate_repository.get_by_email(db, user.email)
    if not candidate or cv.id_candidate != candidate.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    return cv


async def list_candidatures(db: AsyncSession, user, page: int, limit: int) -> dict:
    candidate = await candidate_repository.get_by_email(db, user.email)
    if not candidate:
        return {"total": 0, "resultats": []}
    skip = (page - 1) * limit
    total, resultats = await cv_repository.list_resultats(db, candidate.id, skip, limit)
    return {"total": total, "resultats": resultats}
