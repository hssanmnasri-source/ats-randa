from fastapi import APIRouter, Depends, Query, UploadFile, File, Form, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select, func
from typing import Optional, List
from app.core.database import get_db
from app.api.dependencies import require_agent
from app.models.db_models import CV, Resultat
from app.models.schemas.agent_schemas import CVListOut, CVDetailOut
from app.services.agent import cv_service
from app.repositories import cv_repository

router = APIRouter(
    prefix="/api/agent",
    tags=["📋 Agent — CVs physiques"],
)

ALLOWED_TYPES = [
    "image/jpeg", "image/jpg",
    "image/png", "image/webp",
    "application/pdf"
]


@router.post("/cvs/upload", status_code=201)
async def upload_cv(
    file: UploadFile = File(...),
    nom: str = Form(...),
    prenom: str = Form(...),
    email: Optional[str] = Form(None),
    telephone: Optional[str] = Form(None),
    offer_id: Optional[int] = Form(None),
    agent=Depends(require_agent),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload une photo ou PDF du CV physique.
    Le texte est extrait automatiquement par OCR.
    offer_id : association optionnelle à une offre existante.
    """
    nom_clean = nom.strip()
    prenom_clean = prenom.strip()
    email_clean = email.strip() if email else None
    telephone_clean = telephone.strip() if telephone else None

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Type non supporté: {file.content_type}"
        )

    file_bytes = await file.read()
    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Fichier trop volumineux (max 10MB)"
        )

    from app.nlp.ocr import extract_text, evaluate_ocr_quality
    cv_text = extract_text(file_bytes, file.content_type)
    ocr_quality = evaluate_ocr_quality(cv_text)

    candidate_data = {
        "nom": nom_clean,
        "prenom": prenom_clean,
        "email": email_clean,
        "telephone": telephone_clean,
    }

    result = await cv_service.register_cv_upload(
        db=db,
        file_bytes=file_bytes,
        content_type=file.content_type,
        filename=file.filename,
        candidate_data=candidate_data,
        agent_id=agent.id
    )

    result["ocr_quality"] = ocr_quality
    result["offer_id"] = offer_id
    return result


@router.post("/cvs/batch", status_code=201)
async def upload_cvs_batch(
    files: List[UploadFile] = File(...),
    offer_id: Optional[int] = Form(None),
    agent=Depends(require_agent),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload multiple CVs en une session (batch scan).
    Maximum 10 fichiers par requête.
    """
    if len(files) > 10:
        raise HTTPException(400, "Maximum 10 CVs par batch")

    from app.nlp.ocr import extract_text, evaluate_ocr_quality

    results = []
    for i, file in enumerate(files):
        try:
            if file.content_type not in ALLOWED_TYPES:
                results.append({
                    "fichier": file.filename,
                    "statut": "ERREUR",
                    "message": f"Format non supporté : {file.content_type}",
                    "cv_id": None,
                })
                continue

            file_bytes = await file.read()
            if len(file_bytes) > 10 * 1024 * 1024:
                results.append({
                    "fichier": file.filename,
                    "statut": "ERREUR",
                    "message": "Fichier trop volumineux (max 10MB)",
                    "cv_id": None,
                })
                continue

            cv_text = extract_text(file_bytes, file.content_type)
            ocr_quality = evaluate_ocr_quality(cv_text)

            filename_clean = (file.filename or f"fichier_{i+1}").rsplit('.', 1)[0].replace('_', ' ')

            result = await cv_service.register_cv_upload(
                db=db,
                file_bytes=file_bytes,
                content_type=file.content_type,
                filename=file.filename,
                candidate_data={
                    "nom": f"Candidat_{i+1}",
                    "prenom": filename_clean[:50],
                    "email": None,
                    "telephone": None,
                },
                agent_id=agent.id
            )

            results.append({
                "fichier": file.filename,
                "statut": "OK",
                "cv_id": result["cv_id"],
                "candidate_id": result["candidate_id"],
                "ocr_quality": ocr_quality,
                "message": ocr_quality["message"],
            })

        except Exception as e:
            results.append({
                "fichier": file.filename,
                "statut": "ERREUR",
                "message": str(e),
                "cv_id": None,
            })

    ok = sum(1 for r in results if r["statut"] == "OK")
    erreurs = len(results) - ok

    return {
        "total": len(files),
        "reussis": ok,
        "erreurs": erreurs,
        "resultats": results,
    }


@router.get("/history")
async def get_agent_history(
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=100),
    agent=Depends(require_agent),
    db: AsyncSession = Depends(get_db)
):
    """Historique complet de l'activité de l'agent"""
    skip = (page - 1) * limit

    total = await db.scalar(
        select(func.count(CV.id)).where(CV.id_agent == agent.id)
    )

    cvs_result = await db.execute(
        select(CV)
        .options(selectinload(CV.candidate))
        .options(selectinload(CV.resultats).selectinload(Resultat.offre))
        .where(CV.id_agent == agent.id)
        .order_by(CV.created_at.desc())
        .offset(skip).limit(limit)
    )
    cvs_list = cvs_result.scalars().all()

    return {
        "total": total or 0,
        "page": page,
        "history": [
            {
                "cv_id": cv.id,
                "date": cv.created_at.isoformat() if cv.created_at else None,
                "candidat_nom": cv.candidate.nom if cv.candidate else "?",
                "candidat_prenom": cv.candidate.prenom if cv.candidate else "?",
                "candidat_email": cv.candidate.email if cv.candidate else None,
                "cv_statut": cv.statut.value,
                "nb_offres_matchees": len(cv.resultats),
                "meilleur_score": max(
                    (r.score_final for r in cv.resultats if r.score_final), default=None
                ),
                "decisions": {
                    "retained": sum(1 for r in cv.resultats if r.decision.value == "RETAINED"),
                    "refused": sum(1 for r in cv.resultats if r.decision.value == "REFUSED"),
                    "pending": sum(1 for r in cv.resultats if r.decision.value == "PENDING"),
                },
                "offres": [
                    {
                        "offre_id": r.id_offre,
                        "offre_titre": r.offre.titre if r.offre else "?",
                        "decision": r.decision.value,
                        "score": r.score_final,
                    }
                    for r in cv.resultats
                ],
            }
            for cv in cvs_list
        ],
    }


@router.get("/cvs", response_model=CVListOut)
async def list_cvs(
    statut: Optional[str] = Query(None, description="UPLOADED | PARSING | INDEXED | ERROR"),
    search: Optional[str] = Query(None, description="Recherche nom / prénom / email candidat"),
    page:   int = Query(1, ge=1),
    limit:  int = Query(20, ge=1, le=100),
    agent=Depends(require_agent),
    db: AsyncSession = Depends(get_db),
):
    """Liste uniquement les CVs uploadés par cet agent."""
    skip = (page - 1) * limit
    total, cvs = await cv_repository.list_by_agent(db, agent_id=agent.id, statut=statut, search=search, skip=skip, limit=limit)
    return CVListOut(total=total, page=page, pages=max(1, -(-total // limit)), cvs=cvs)


@router.get("/cvs/{cv_id}", response_model=CVDetailOut)
async def get_cv(
    cv_id: int,
    agent=Depends(require_agent),
    db: AsyncSession = Depends(get_db),
):
    """Détail d'un CV avec les informations du candidat et les entités extraites."""
    res = await db.execute(
        select(CV).options(selectinload(CV.candidate)).where(CV.id == cv_id)
    )
    cv = res.scalar_one_or_none()
    if not cv:
        raise HTTPException(status_code=404, detail="CV introuvable")
    return cv
