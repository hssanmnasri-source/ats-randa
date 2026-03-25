"""
services/candidate/document_service.py
"""
import os
import uuid
from fastapi import HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import candidate_repository
from app.repositories import document_repository
from app.core.config import settings

ALLOWED_TYPES = {
    "application/pdf", "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
MAX_SIZE = 10 * 1024 * 1024  # 10 MB


async def _get_candidate(db, user):
    c = await candidate_repository.get_by_email(db, user.email)
    if not c:
        raise HTTPException(status_code=404, detail="Profil candidat introuvable")
    return c


async def list_documents(db: AsyncSession, user):
    candidate = await _get_candidate(db, user)
    total, items = await document_repository.list_by_candidate(db, candidate.id)
    return {"total": total, "documents": items}


async def upload_document(db: AsyncSession, user, file: UploadFile, type_doc: str = "Autre"):
    candidate = await _get_candidate(db, user)

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Type de fichier non supporté (PDF ou Word)")

    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="Fichier trop volumineux (max 10 MB)")

    # Save to disk
    dest_dir = os.path.join(settings.UPLOAD_DIR, "documents", str(candidate.id))
    os.makedirs(dest_dir, exist_ok=True)
    ext = os.path.splitext(file.filename or "doc")[1] or ".pdf"
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(dest_dir, filename)
    with open(filepath, "wb") as f:
        f.write(content)

    return await document_repository.create(db, candidate.id, {
        "nom":      file.filename or filename,
        "fichier":  filepath,
        "type_doc": type_doc,
        "taille":   len(content),
    })


async def delete_document(db: AsyncSession, user, doc_id: int) -> None:
    candidate = await _get_candidate(db, user)
    doc = await document_repository.get_by_id(db, doc_id, candidate.id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document introuvable")
    # Remove file from disk (best-effort)
    try:
        if doc.fichier and os.path.exists(doc.fichier):
            os.remove(doc.fichier)
    except OSError:
        pass
    await document_repository.delete(db, doc)
