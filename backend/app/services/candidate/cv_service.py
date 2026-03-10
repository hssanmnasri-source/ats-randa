from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, UploadFile, status
from app.repositories import cv_repository, candidate_repository
from app.models.db_models import CVStatus
import os, shutil, uuid

UPLOAD_DIR = "/app/uploads/cvs"

async def get_or_create_candidate(db: AsyncSession, user) -> int:
    """Récupère ou crée un candidat lié à l'utilisateur connecté."""
    candidate = await candidate_repository.get_by_email(db, user.email)
    if not candidate:
        candidate = await candidate_repository.create(db, {
            "nom":    user.nom,
            "prenom": user.prenom,
            "email":  user.email,
        })
    return candidate.id

async def upload_cv(
    db: AsyncSession,
    file: UploadFile,
    user
) -> dict:
    # Valider le type de fichier
    allowed = ["application/pdf",
               "application/vnd.openxmlformats-officedocument"
               ".wordprocessingml.document"]
    if file.content_type not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Format non supporté — PDF ou DOCX uniquement"
        )

    # Valider la taille (max 10MB)
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Fichier trop volumineux — max 10MB"
        )

    # Sauvegarder le fichier
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = file.filename.rsplit(".", 1)[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(content)

    # Récupérer ou créer le candidat
    candidate_id = await get_or_create_candidate(db, user)

    # Créer l'entrée CV
    cv = await cv_repository.create(db, {
        "id_candidate": candidate_id,
        "fichier_pdf":  filename,
        "statut":       CVStatus.UPLOADED,
        "score_final":  0.0,
    })

    return cv

async def list_cvs(db: AsyncSession, user, page: int, limit: int):
    candidate = await candidate_repository.get_by_email(db, user.email)
    if not candidate:
        return {"total": 0, "cvs": []}

    skip = (page - 1) * limit
    total, cvs = await cv_repository.list_by_candidate(
        db, candidate.id, skip, limit
    )
    return {"total": total, "cvs": cvs}

async def get_cv(db: AsyncSession, cv_id: int, user):
    cv = await cv_repository.get_by_id(db, cv_id)
    if not cv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CV introuvable"
        )

    # Vérifier que ce CV appartient bien à ce candidat
    candidate = await candidate_repository.get_by_email(db, user.email)
    if not candidate or cv.id_candidate != candidate.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé"
        )
    return cv

async def list_candidatures(db: AsyncSession, user, page: int, limit: int):
    candidate = await candidate_repository.get_by_email(db, user.email)
    if not candidate:
        return {"total": 0, "resultats": []}

    skip = (page - 1) * limit
    total, resultats = await cv_repository.list_resultats(
        db, candidate.id, skip, limit
    )
    return {"total": total, "resultats": resultats}