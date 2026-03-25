"""
api/routes/candidate/documents.py
"""
from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.dependencies import require_candidate
from app.models.schemas.candidate_schemas import DocumentOut, DocumentListOut
from app.services.candidate import document_service

router = APIRouter(
    prefix="/api/candidate",
    tags=["👤 Candidat — Documents"],
)


@router.get("/documents", response_model=DocumentListOut)
async def list_documents(
    candidate=Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    """Liste mes documents (CV, diplômes, pièce d'identité…)."""
    return await document_service.list_documents(db, candidate)


@router.post("/documents/upload", response_model=DocumentOut, status_code=201)
async def upload_document(
    file:     UploadFile = File(...),
    type_doc: str        = Form("Autre"),
    candidate=Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    """Upload un document (PDF ou Word, max 10 MB)."""
    return await document_service.upload_document(db, candidate, file, type_doc)


@router.delete("/documents/{doc_id}", status_code=200)
async def delete_document(
    doc_id: int,
    candidate=Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    """Supprime un document."""
    await document_service.delete_document(db, candidate, doc_id)
    return {"message": "Document supprimé"}
