"""
import_keejob.py
Route FastAPI : import d'un CV Keejob via upload PDF.

POST /api/agent/import/keejob
  → Extrait le texte (pdfplumber)
  → Parse les entités (keejob_parser)
  → Crée le candidat (skip si email existe)
  → Crée le CV avec statut INDEXED
  → Enregistre compétences + expériences
  → Retourne les données extraites
"""

import io
from datetime import datetime

import pdfplumber
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import require_agent
from app.core.database import get_db
from app.models.db_models import CVStatus
from app.nlp.keejob_parser import parse_keejob_cv
from app.repositories import candidate_repository, cv_repository

router = APIRouter(
    prefix="/api/agent",
    tags=["📥 Agent — Import Keejob"],
)


def _extract_text_from_bytes(file_bytes: bytes) -> str:
    """Extrait le texte d'un PDF en mémoire avec pdfplumber."""
    parts: list[str] = []
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                txt = page.extract_text()
                if txt:
                    parts.append(txt)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Impossible d'ouvrir le PDF : {exc}",
        )
    return "\n".join(parts)


@router.post("/import/keejob", status_code=201)
async def import_keejob_cv(
    file: UploadFile = File(..., description="PDF Keejob à importer"),
    agent=Depends(require_agent),
    db: AsyncSession = Depends(get_db),
):
    """
    Importe un CV Keejob (PDF natif Keejob.com) :

    1. Valide le fichier (PDF, ≤ 10 MB)
    2. Extrait le texte avec pdfplumber
    3. Parse toutes les entités (keejob_parser)
    4. Crée ou retrouve le candidat (déduplique par email)
    5. Crée le CV en DB avec statut **INDEXED** et cv_entities rempli
    6. Enregistre les compétences et expériences
    7. Retourne les données extraites pour confirmation
    """

    # ── 1. Validation ─────────────────────────────────────────────────────
    if file.content_type not in ("application/pdf", "application/x-pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Type de fichier non supporté : {file.content_type}. Seul le PDF est accepté.",
        )

    file_bytes = await file.read()

    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Fichier vide",
        )

    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Fichier trop volumineux (max 10 MB)",
        )

    # ── 2. Extraction du texte ────────────────────────────────────────────
    cv_text = _extract_text_from_bytes(file_bytes)

    if not cv_text.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Aucun texte extrait du PDF (PDF scanné ou protégé ?). Utilisez /api/agent/cvs/upload pour l'OCR.",
        )

    # ── 3. Parsing Keejob ─────────────────────────────────────────────────
    entities = parse_keejob_cv(cv_text)

    # ── 4. Candidat ───────────────────────────────────────────────────────
    candidate_data: dict = {
        "nom":       entities.get("nom") or "Inconnu",
        "prenom":    entities.get("prenom") or "Inconnu",
        "email":     entities.get("email"),
        "telephone": entities.get("telephone"),
        "adresse":   entities.get("adresse"),
    }
    if entities.get("age"):
        candidate_data["date_naissance"] = str(datetime.now().year - entities["age"])

    candidate_data = {k: v for k, v in candidate_data.items() if v is not None}

    candidate, created = await candidate_repository.get_or_create(db, candidate_data)

    # ── 5. Création du CV ─────────────────────────────────────────────────
    cv = await cv_repository.create(db, {
        "id_candidate": candidate.id,
        "id_agent":     agent.id,
        "statut":       CVStatus.INDEXED,
        "fichier_pdf":  file.filename,
        "cv_text":      cv_text,
        "cv_entities":  entities,      # tout le dict parsé → JSONB
    })

    # ── 6. Compétences ────────────────────────────────────────────────────
    if entities.get("competences"):
        await cv_repository.add_competences(db, cv.id, entities["competences"])

    # ── 7. Expériences ────────────────────────────────────────────────────
    if entities.get("experiences"):
        await cv_repository.add_experiences(db, cv.id, entities["experiences"])

    # ── 8. Réponse ────────────────────────────────────────────────────────
    return {
        "cv_id":             cv.id,
        "candidate_id":      candidate.id,
        "candidate_created": created,
        "statut":            cv.statut.value,
        "fichier":           file.filename,
        "nb_caracteres":     len(cv_text),
        "entities": {
            "id_keejob":         entities.get("id_keejob"),
            "titre_poste":       entities.get("titre_poste"),
            "nom":               entities.get("nom"),
            "prenom":            entities.get("prenom"),
            "age":               entities.get("age"),
            "email":             entities.get("email"),
            "telephone":         entities.get("telephone"),
            "ville":             entities.get("ville"),
            "niveau_etude":      entities.get("niveau_etude"),
            "experience_annees": entities.get("experience_annees"),
            "situation_pro":     entities.get("situation_pro"),
            "disponibilite":     entities.get("disponibilite"),
            "permis_conduire":   entities.get("permis_conduire"),
            "salaire_souhaite":  entities.get("salaire_souhaite"),
            "nb_competences":    len(entities.get("competences", [])),
            "nb_experiences":    len(entities.get("experiences", [])),
            "nb_formations":     len(entities.get("formations", [])),
            "nb_langues":        len(entities.get("langues", [])),
            "resume":            (entities.get("resume") or "")[:300] or None,
        },
        "message": (
            "CV Keejob importé avec succès — nouveau candidat créé"
            if created
            else "CV Keejob importé avec succès — candidat existant"
        ),
    }
