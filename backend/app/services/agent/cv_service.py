from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.repositories import cv_repository, candidate_repository
from app.models.db_models import CVStatus
from app.nlp.ocr import extract_text
from typing import Optional


async def register_cv_upload(
    db: AsyncSession,
    file_bytes: bytes,
    content_type: str,
    filename: str,
    candidate_data: dict,
    agent_id: int
):
    """Upload image/PDF → OCR → DB"""

    # ── 1. OCR ────────────────────────────────────
    cv_text = extract_text(file_bytes, content_type)
    if not cv_text:
        cv_text = f"[Texte non extrait — fichier: {filename}]"

    # ── 2. Candidat ───────────────────────────────
    clean_data = {k: v for k, v in candidate_data.items() if v}
    candidate, created = await candidate_repository.get_or_create(
        db, clean_data
    )

    # ── 3. CV en DB ───────────────────────────────
    cv = await cv_repository.create(db, {
        "id_candidate": candidate.id,
        "id_agent":     agent_id,
        "statut":       CVStatus.UPLOADED,
        "cv_text":      cv_text,
        "cv_entities":  {},
    })

    return {
        "cv_id":             cv.id,
        "candidate_id":      candidate.id,
        "candidate_created": created,
        "statut":            cv.statut.value,
        "texte_extrait":     cv_text[:300] + "..." if len(cv_text) > 300 else cv_text,
        "nb_caracteres":     len(cv_text),
        "message":           "CV uploadé et texte extrait avec succès"
    }


async def register_cv(db: AsyncSession, data, agent_id: int):
    """Saisie manuelle d'un CV sans fichier"""

    candidate_data = data.candidate.model_dump(exclude_none=True)
    candidate, created = await candidate_repository.get_or_create(
        db, candidate_data
    )

    cv = await cv_repository.create(db, {
        "id_candidate": candidate.id,
        "id_agent":     agent_id,
        "statut":       CVStatus.UPLOADED,
        "cv_text":      data.cv_text,
        "cv_entities":  {},
    })

    if data.competences:
        await cv_repository.add_competences(db, cv.id, data.competences)

    if data.experiences:
        await cv_repository.add_experiences(db, cv.id, data.experiences)

    return {
        "cv_id":             cv.id,
        "candidate_id":      candidate.id,
        "candidate_created": created,
        "statut":            cv.statut.value,
        "message":           "CV enregistré manuellement avec succès"
    }


async def get_cv(db: AsyncSession, cv_id: int, agent_id: int):
    cv = await cv_repository.get_by_id(db, cv_id)
    if not cv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CV introuvable"
        )
    if cv.id_agent != agent_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé"
        )
    return _format_cv_detail(cv)


async def list_cvs(
    db: AsyncSession,
    agent_id: int,
    statut: Optional[str] = None,
    page: int = 1,
    limit: int = 20
):
    skip = (page - 1) * limit
    total, cvs = await cv_repository.list_by_agent(
        db, agent_id, statut, skip, limit
    )
    return {"total": total, "cvs": cvs}


def _format_cv_detail(cv) -> dict:
    return {
        "id":           cv.id,
        "id_candidate": cv.id_candidate,
        "id_agent":     cv.id_agent,
        "statut":       cv.statut.value,
        "date_depot":   cv.date_depot,
        "cv_text":      cv.cv_text,
        "cv_entities":  cv.cv_entities,
        "competences":  [c.nom_competence for c in cv.competences],
        "experiences":  [
            {
                "poste":      e.poste,
                "entreprise": e.entreprise,
                "date_debut": e.date_debut,
                "date_fin":   e.date_fin,
            }
            for e in cv.experiences
        ],
        "candidate": {
            "id":     cv.candidate.id,
            "nom":    cv.candidate.nom,
            "prenom": cv.candidate.prenom,
            "email":  cv.candidate.email,
        }
    }