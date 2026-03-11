from fastapi import APIRouter, Depends, Query, UploadFile, File, Form
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.core.database import get_db
from app.api.dependencies import require_agent
from app.models.schemas.agent_schemas import CVCreateIn, CVListOut
from app.services.agent import cv_service

router = APIRouter(
    prefix="/api/agent",
    tags=["📋 Agent — CVs physiques"],
)

@router.post("/cvs/upload", status_code=201)
async def upload_cv(
    file: UploadFile = File(...),
    nom: str = Form(...),
    prenom: str = Form(...),
    email: Optional[str] = Form(None),
    telephone: Optional[str] = Form(None),
    agent=Depends(require_agent),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload une photo ou PDF du CV physique.
    Le texte est extrait automatiquement par OCR.
    """

    # ── Nettoyage des champs ─────────────────────
    nom_clean = nom.strip()
    prenom_clean = prenom.strip()
    email_clean = email.strip() if email else None
    telephone_clean = telephone.strip() if telephone else None

    # ── Vérifier le type de fichier ──────────────
    allowed_types = [
        "image/jpeg", "image/jpg",
        "image/png", "image/webp",
        "application/pdf"
    ]

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Type non supporté: {file.content_type}"
        )

    # ── Vérifier la taille du fichier ────────────
    file_bytes = await file.read()

    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Fichier trop volumineux (max 10MB)"
        )

    # ── Données candidat ─────────────────────────
    candidate_data = {
        "nom": nom_clean,
        "prenom": prenom_clean,
        "email": email_clean,
        "telephone": telephone_clean,
    }

    return await cv_service.register_cv_upload(
        db=db,
        file_bytes=file_bytes,
        content_type=file.content_type,
        filename=file.filename,
        candidate_data=candidate_data,
        agent_id=agent.id
    )