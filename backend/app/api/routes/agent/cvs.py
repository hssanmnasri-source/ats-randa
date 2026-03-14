from fastapi import APIRouter, Depends, Query, UploadFile, File, Form, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select
from typing import Optional
from app.core.database import get_db
from app.api.dependencies import require_agent
from app.models.db_models import CV
from app.models.schemas.agent_schemas import CVListOut, CVDetailOut
from app.services.agent import cv_service
from app.repositories import cv_repository

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


@router.get("/cvs", response_model=CVListOut)
async def list_cvs(
    source: Optional[str] = Query(None, description="KEEJOB | AGENT | CANDIDAT | EMAIL | LINKEDIN"),
    statut: Optional[str] = Query(None, description="UPLOADED | PARSING | INDEXED | ERROR"),
    search: Optional[str] = Query(None, description="Recherche nom / prénom / email candidat"),
    page:   int = Query(1, ge=1),
    limit:  int = Query(20, ge=1, le=100),
    agent=Depends(require_agent),
    db: AsyncSession = Depends(get_db),
):
    """Liste tous les CVs avec filtres optionnels (source, statut, recherche)."""
    skip = (page - 1) * limit
    total, cvs = await cv_repository.list_all(db, source=source, statut=statut, search=search, skip=skip, limit=limit)
    return CVListOut(total=total, page=page, pages=max(1, -(-total // limit)), cvs=cvs)


@router.get("/cvs/{cv_id}", response_model=CVDetailOut)
async def get_cv(
    cv_id: int,
    agent=Depends(require_agent),
    db: AsyncSession = Depends(get_db),
):
    """Détail d'un CV avec les informations du candidat et les entités extraites."""
    from sqlalchemy.orm import selectinload
    from sqlalchemy import select
    from app.models.db_models import CV

    res = await db.execute(
        select(CV).options(selectinload(CV.candidate)).where(CV.id == cv_id)
    )
    cv = res.scalar_one_or_none()
    if not cv:
        raise HTTPException(status_code=404, detail="CV introuvable")
    return cv