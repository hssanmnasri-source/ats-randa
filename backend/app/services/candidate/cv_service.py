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

    # Déclencher embedding + matching async (PENDING uniquement)
    from app.tasks.cv_tasks import process_cv_on_upload
    process_cv_on_upload.delay(cv.id)

    # Notification email (fire-and-forget)
    import asyncio
    from app.core.mailer import send_cv_received
    candidate = await candidate_repository.get_by_id(db, candidate_id)
    if candidate and candidate.email:
        asyncio.create_task(send_cv_received(candidate.email, candidate.nom or "", candidate.prenom or ""))

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

    # Déclencher embedding + matching async (PENDING uniquement)
    from app.tasks.cv_tasks import process_cv_on_upload
    process_cv_on_upload.delay(cv.id)

    # Notification email (fire-and-forget)
    import asyncio
    from app.core.mailer import send_cv_received
    candidate = await candidate_repository.get_by_id(db, candidate_id)
    if candidate and candidate.email:
        asyncio.create_task(send_cv_received(candidate.email, candidate.nom or "", candidate.prenom or ""))

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


async def validate_cv(db: AsyncSession, cv_id: int, user, data) -> dict:
    """
    Sauvegarde les corrections humaines après lecture OCR, puis re-indexe le CV.

    Étapes :
      1. Vérifier que le CV appartient au candidat
      2. Mettre à jour les champs personnels du candidat
      3. Remplacer les expériences et compétences du CV par les données corrigées
      4. Mettre à jour cv_entities avec les données validées
      5. Relancer process_cv_on_upload (embedding + matching)
    """
    from sqlalchemy import select, delete
    from app.models.db_models import Experience, Competence, CVStatus, SkillLevel

    # ── 1. Charger et vérifier le CV ────────────────────────────────────────
    cv = await cv_repository.get_by_id(db, cv_id)
    if not cv:
        raise HTTPException(status_code=404, detail="CV introuvable")

    candidate = await candidate_repository.get_by_email(db, user.email)
    if not candidate or cv.id_candidate != candidate.id:
        raise HTTPException(status_code=403, detail="Accès refusé")

    # ── 2. Mise à jour profil candidat ──────────────────────────────────────
    personal_updates = {
        k: v for k, v in {
            "nom":           data.nom,
            "prenom":        data.prenom,
            "telephone":     data.telephone,
            "adresse":       data.adresse,
            "titre_poste":   data.titre_poste,
            "niveau_etude":  data.niveau_etude,
            "disponibilite": data.disponibilite,
        }.items() if v is not None
    }
    if personal_updates:
        await candidate_repository.update(db, candidate, personal_updates)

    # ── 3. Remplacer expériences ─────────────────────────────────────────────
    await db.execute(delete(Experience).where(Experience.id_cv == cv_id))
    await db.commit()

    for exp in data.experiences:
        if not (exp.poste or exp.entreprise):
            continue
        db.add(Experience(
            id_cv=cv_id,
            poste=exp.poste or None,
            entreprise=exp.entreprise or None,
            date_debut=exp.date_debut or None,
            date_fin=exp.date_fin or None,
            description=exp.description or None,
            is_current=exp.is_current,
        ))
    await db.commit()

    # ── 4. Remplacer compétences ─────────────────────────────────────────────
    await db.execute(delete(Competence).where(Competence.id_cv == cv_id))
    await db.commit()

    for nom_comp in data.competences:
        nom_comp = nom_comp.strip()
        if nom_comp:
            db.add(Competence(
                id_cv=cv_id,
                nom_competence=nom_comp,
                niveau=SkillLevel.INTERMEDIATE,
            ))
    await db.commit()

    # ── 5. Mettre à jour cv_entities ─────────────────────────────────────────
    entities = dict(cv.cv_entities or {})
    if data.nom:           entities["nom"]           = data.nom
    if data.prenom:        entities["prenom"]        = data.prenom
    if data.telephone:     entities["telephone"]     = data.telephone
    if data.adresse:       entities["adresse"]       = data.adresse
    if data.titre_poste:   entities["titre_poste"]   = data.titre_poste
    if data.niveau_etude:  entities["niveau_etude"]  = data.niveau_etude
    if data.disponibilite: entities["disponibilite"] = data.disponibilite
    if data.resume:        entities["resume"]        = data.resume
    entities["competences"] = [{"nom_competence": c, "niveau": "INTERMEDIATE"} for c in data.competences if c.strip()]
    entities["langues"]     = [l.model_dump() for l in data.langues]
    entities["experiences"] = [
        {
            "poste":       e.poste,
            "entreprise":  e.entreprise,
            "date_debut":  e.date_debut,
            "date_fin":    e.date_fin,
            "description": e.description,
            "is_current":  e.is_current,
        }
        for e in data.experiences
    ]

    await cv_repository.update(db, cv, {
        "cv_entities": entities,
        "statut": CVStatus.INDEXED,
    })

    # ── 6. Re-déclencher embedding + matching ────────────────────────────────
    from app.tasks.cv_tasks import process_cv_on_upload
    process_cv_on_upload.delay(cv_id)

    return await cv_repository.get_by_id(db, cv_id)


async def list_candidatures(db: AsyncSession, user, page: int, limit: int) -> dict:
    candidate = await candidate_repository.get_by_email(db, user.email)
    if not candidate:
        return {"total": 0, "resultats": []}
    skip = (page - 1) * limit
    total, resultats = await cv_repository.list_resultats(db, candidate.id, skip, limit)
    return {"total": total, "resultats": resultats}
