"""
services/candidate/profile_service.py
Logique métier pour le profil candidat étendu.
"""
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.repositories import candidate_repository
from app.models.db_models import CV, CVSource, CVStatus, Competence, Experience
from app.models.schemas.candidate_schemas import (
    CandidateProfileUpdateIn,
    ExperienceIn,
    SkillIn,
    VisibilityUpdateIn,
)


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _get_candidate_or_404(db: AsyncSession, user):
    candidate = await candidate_repository.get_by_email(db, user.email)
    if not candidate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Profil candidat introuvable")
    return candidate


async def _get_or_create_profile_cv(db: AsyncSession, candidate_id: int) -> CV:
    """Return the candidate's CANDIDAT-source CV, creating a stub if none exists."""
    result = await db.execute(
        select(CV)
        .where(CV.id_candidate == candidate_id, CV.source == CVSource.CANDIDAT)
        .order_by(CV.created_at.desc())
        .limit(1)
    )
    cv = result.scalar_one_or_none()
    if not cv:
        cv = CV(
            id_candidate=candidate_id,
            source=CVSource.CANDIDAT,
            statut=CVStatus.INDEXED,
            cv_entities={},
        )
        db.add(cv)
        await db.commit()
        await db.refresh(cv)
    return cv


# ── Profile CRUD ──────────────────────────────────────────────────────────────

async def get_profile(db: AsyncSession, user):
    """Return or auto-create the candidate profile."""
    candidate = await candidate_repository.get_by_email(db, user.email)
    if not candidate:
        candidate = await candidate_repository.create(db, {
            "nom":    getattr(user, "nom",    None),
            "prenom": getattr(user, "prenom", None),
            "email":  user.email,
        })
    return candidate


async def update_profile(db: AsyncSession, user, data: CandidateProfileUpdateIn):
    candidate = await _get_candidate_or_404(db, user)
    updates = {k: v for k, v in data.model_dump(exclude_none=True).items()}
    if not updates:
        return candidate
    return await candidate_repository.update(db, candidate, updates)


async def update_visibility(db: AsyncSession, user, data: VisibilityUpdateIn):
    candidate = await _get_candidate_or_404(db, user)
    updates: dict = {"visibility_status": data.visibility_status}
    if data.alert_frequency:
        updates["alert_frequency"] = data.alert_frequency
    return await candidate_repository.update(db, candidate, updates)


# ── Profile completion ────────────────────────────────────────────────────────

async def compute_completion(db: AsyncSession, candidate) -> dict:
    """Calculate completion percentage across all sections (0-100)."""
    # Load all INDEXED CVs
    cvs_r = await db.execute(
        select(CV).where(CV.id_candidate == candidate.id, CV.statut == CVStatus.INDEXED)
    )
    cvs = cvs_r.scalars().all()

    # Load competences (via any CV)
    cv_ids = [cv.id for cv in cvs]
    competences = []
    experiences = []
    if cv_ids:
        comp_r = await db.execute(
            select(Competence).where(Competence.id_cv.in_(cv_ids))
        )
        competences = comp_r.scalars().all()

        exp_r = await db.execute(
            select(Experience).where(Experience.id_cv.in_(cv_ids))
        )
        experiences = exp_r.scalars().all()

    sections = {}

    # Personal (15%) — 6 fields
    p_fields = [
        candidate.nom, candidate.prenom, candidate.telephone,
        candidate.adresse, candidate.date_naissance, candidate.genre,
    ]
    p_filled = sum(1 for f in p_fields if f)
    sections["personal"] = {
        "label": "Informations personnelles",
        "weight": 15,
        "score": round(p_filled / len(p_fields) * 15),
        "filled": p_filled == len(p_fields),
    }

    # Professional (15%) — 3 fields
    pr_fields = [candidate.titre_poste, candidate.niveau_etude, candidate.disponibilite]
    pr_filled = sum(1 for f in pr_fields if f)
    sections["professional"] = {
        "label": "Identité professionnelle",
        "weight": 15,
        "score": round(pr_filled / len(pr_fields) * 15),
        "filled": pr_filled == len(pr_fields),
    }

    # Experiences (25%)
    sections["experiences"] = {
        "label": "Expériences professionnelles",
        "weight": 25,
        "score": 25 if experiences else 0,
        "filled": bool(experiences),
    }

    # Degrees (15%)
    has_degrees = any(
        cv.cv_entities and cv.cv_entities.get("formations") for cv in cvs
    )
    sections["degrees"] = {
        "label": "Formation & Diplômes",
        "weight": 15,
        "score": 15 if has_degrees else 0,
        "filled": has_degrees,
    }

    # Skills (10%)
    sections["skills"] = {
        "label": "Compétences",
        "weight": 10,
        "score": 10 if competences else 0,
        "filled": bool(competences),
    }

    # Languages (10%)
    has_langs = any(
        cv.cv_entities and cv.cv_entities.get("langues") for cv in cvs
    )
    sections["languages"] = {
        "label": "Langues",
        "weight": 10,
        "score": 10 if has_langs else 0,
        "filled": has_langs,
    }

    # Photo (5%)
    sections["photo"] = {
        "label": "Photo de profil",
        "weight": 5,
        "score": 5 if candidate.photo_url else 0,
        "filled": bool(candidate.photo_url),
    }

    # Extras (5%) — nationality + marital status
    e_fields = [candidate.nationalite, candidate.situation_familiale]
    e_filled = sum(1 for f in e_fields if f)
    sections["extras"] = {
        "label": "Informations complémentaires",
        "weight": 5,
        "score": round(e_filled / len(e_fields) * 5),
        "filled": e_filled == len(e_fields),
    }

    total = sum(s["score"] for s in sections.values())
    return {"total": total, "sections": sections}


async def get_full_profile(db: AsyncSession, user) -> dict:
    """Single call returning profile + completion + experiences + skills + languages."""
    candidate = await get_profile(db, user)
    completion = await compute_completion(db, candidate)

    # Load experiences
    cv_ids_r = await db.execute(
        select(CV.id).where(CV.id_candidate == candidate.id, CV.statut == CVStatus.INDEXED)
    )
    cv_ids = cv_ids_r.scalars().all()

    experiences = []
    skills = []
    langues = []
    if cv_ids:
        exp_r = await db.execute(
            select(Experience).where(Experience.id_cv.in_(cv_ids))
            .order_by(Experience.id.desc())
        )
        experiences = exp_r.scalars().all()

        skill_r = await db.execute(
            select(Competence).where(Competence.id_cv.in_(cv_ids))
            .order_by(Competence.id.desc())
        )
        skills = skill_r.scalars().all()

        # Collect langues from cv_entities
        cvs_r = await db.execute(
            select(CV).where(CV.id.in_(cv_ids))
        )
        for cv in cvs_r.scalars().all():
            if cv.cv_entities and cv.cv_entities.get("langues"):
                langues = cv.cv_entities["langues"]
                break  # use first CV with languages

    return {
        "profile": candidate,
        "completion": completion,
        "experiences": list(experiences),
        "skills": list(skills),
        "langues": langues,
    }


# ── Experience CRUD ───────────────────────────────────────────────────────────

async def list_experiences(db: AsyncSession, user) -> list:
    candidate = await _get_candidate_or_404(db, user)
    cv_ids_r = await db.execute(
        select(CV.id).where(CV.id_candidate == candidate.id)
    )
    cv_ids = cv_ids_r.scalars().all()
    if not cv_ids:
        return []
    exp_r = await db.execute(
        select(Experience).where(Experience.id_cv.in_(cv_ids))
        .order_by(Experience.id.desc())
    )
    return exp_r.scalars().all()


async def add_experience(db: AsyncSession, user, data: ExperienceIn):
    candidate = await _get_candidate_or_404(db, user)
    cv = await _get_or_create_profile_cv(db, candidate.id)
    exp = Experience(id_cv=cv.id, **data.model_dump())
    db.add(exp)
    await db.commit()
    await db.refresh(exp)
    return exp


async def delete_experience(db: AsyncSession, user, exp_id: int) -> None:
    candidate = await _get_candidate_or_404(db, user)
    cv_ids_r = await db.execute(
        select(CV.id).where(CV.id_candidate == candidate.id)
    )
    cv_ids = cv_ids_r.scalars().all()
    result = await db.execute(
        select(Experience).where(
            Experience.id == exp_id,
            Experience.id_cv.in_(cv_ids),
        )
    )
    exp = result.scalar_one_or_none()
    if not exp:
        raise HTTPException(status_code=404, detail="Expérience introuvable")
    await db.delete(exp)
    await db.commit()


# ── Skill CRUD ────────────────────────────────────────────────────────────────

async def list_skills(db: AsyncSession, user) -> list:
    candidate = await _get_candidate_or_404(db, user)
    cv_ids_r = await db.execute(
        select(CV.id).where(CV.id_candidate == candidate.id)
    )
    cv_ids = cv_ids_r.scalars().all()
    if not cv_ids:
        return []
    skill_r = await db.execute(
        select(Competence).where(Competence.id_cv.in_(cv_ids))
        .order_by(Competence.id.desc())
    )
    return skill_r.scalars().all()


async def add_skill(db: AsyncSession, user, data: SkillIn):
    candidate = await _get_candidate_or_404(db, user)
    cv = await _get_or_create_profile_cv(db, candidate.id)
    skill = Competence(
        id_cv=cv.id,
        nom_competence=data.nom_competence,
        niveau=data.niveau,
    )
    db.add(skill)
    await db.commit()
    await db.refresh(skill)
    return skill


async def delete_skill(db: AsyncSession, user, skill_id: int) -> None:
    candidate = await _get_candidate_or_404(db, user)
    cv_ids_r = await db.execute(
        select(CV.id).where(CV.id_candidate == candidate.id)
    )
    cv_ids = cv_ids_r.scalars().all()
    result = await db.execute(
        select(Competence).where(
            Competence.id == skill_id,
            Competence.id_cv.in_(cv_ids),
        )
    )
    skill = result.scalar_one_or_none()
    if not skill:
        raise HTTPException(status_code=404, detail="Compétence introuvable")
    await db.delete(skill)
    await db.commit()
