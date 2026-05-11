"""
api/routes/candidate/profile.py
Routes de gestion du profil candidat étendu.
"""
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.dependencies import require_candidate
from app.core.security import verify_password, hash_password
from app.models.schemas.candidate_schemas import (
    CandidateProfileOut,
    CandidateProfileUpdateIn,
    PersonalUpdateIn,
    ProfessionalUpdateIn,
    VisibilityUpdateIn,
    ExperienceIn,
    ExperienceOut,
    SkillIn,
    SkillOut,
    ProfileCompletionOut,
    FullProfileOut,
)
from app.services.candidate import profile_service
from app.repositories import candidate_repository
from app.repositories import user_repository


class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str

router = APIRouter(
    prefix="/api/candidate",
    tags=["👤 Candidat — Profil"],
)


@router.get("/profile", response_model=CandidateProfileOut)
async def get_profile(
    candidate=Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    """Récupère mon profil (informations personnelles + champs étendus)."""
    return await profile_service.get_profile(db, candidate)


@router.put("/profile", response_model=CandidateProfileOut)
async def update_profile(
    data: CandidateProfileUpdateIn,
    candidate=Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    """Met à jour les informations du profil candidat."""
    return await profile_service.update_profile(db, candidate, data)


@router.put("/profile/personal", response_model=CandidateProfileOut)
async def update_personal(
    data: PersonalUpdateIn,
    candidate=Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    """Met à jour les informations personnelles et de mobilité."""
    return await profile_service.update_personal(db, candidate, data)


@router.put("/profile/professional", response_model=CandidateProfileOut)
async def update_professional(
    data: ProfessionalUpdateIn,
    candidate=Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    """Met à jour l'identité professionnelle (titre, secteurs, statut…)."""
    return await profile_service.update_professional(db, candidate, data)


@router.put("/profile/visibility", response_model=CandidateProfileOut)
async def update_visibility(
    data: VisibilityUpdateIn,
    candidate=Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    """Met à jour la visibilité du profil et la fréquence d'alertes."""
    return await profile_service.update_visibility(db, candidate, data)


@router.get("/profile/completion", response_model=ProfileCompletionOut)
async def get_completion(
    candidate=Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    """Retourne le pourcentage de complétion du profil par section."""
    from app.repositories import candidate_repository
    profile = await candidate_repository.get_by_email(db, candidate.email)
    if not profile:
        return {"total": 0, "sections": {}}
    return await profile_service.compute_completion(db, profile)


@router.get("/profile/full", response_model=FullProfileOut)
async def get_full_profile(
    candidate=Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    """Profil complet : infos + complétion + expériences + compétences + langues."""
    return await profile_service.get_full_profile(db, candidate)


# ── Photo de profil ───────────────────────────────────────────────────────────

@router.post("/profile/photo", response_model=CandidateProfileOut)
async def upload_photo(
    file: UploadFile = File(...),
    candidate=Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    """Upload ou remplace la photo de profil (JPG/PNG/GIF/WebP, max 2 Mo)."""
    return await profile_service.upload_photo(db, candidate, file)


# ── Expériences ───────────────────────────────────────────────────────────────

@router.get("/profile/experiences", response_model=list[ExperienceOut])
async def list_experiences(
    candidate=Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    return await profile_service.list_experiences(db, candidate)


@router.post("/profile/experiences", response_model=ExperienceOut, status_code=201)
async def add_experience(
    data: ExperienceIn,
    candidate=Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    """Ajoute une expérience professionnelle au profil."""
    return await profile_service.add_experience(db, candidate, data)


@router.delete("/profile/experiences/{exp_id}", status_code=200)
async def delete_experience(
    exp_id: int,
    candidate=Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    """Supprime une expérience professionnelle."""
    await profile_service.delete_experience(db, candidate, exp_id)
    return {"message": "Expérience supprimée"}


# ── Compétences ───────────────────────────────────────────────────────────────

@router.get("/profile/skills", response_model=list[SkillOut])
async def list_skills(
    candidate=Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    return await profile_service.list_skills(db, candidate)


@router.post("/profile/skills", response_model=SkillOut, status_code=201)
async def add_skill(
    data: SkillIn,
    candidate=Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    """Ajoute une compétence au profil."""
    return await profile_service.add_skill(db, candidate, data)


@router.delete("/profile/skills/{skill_id}", status_code=200)
async def delete_skill(
    skill_id: int,
    candidate=Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    """Supprime une compétence."""
    await profile_service.delete_skill(db, candidate, skill_id)
    return {"message": "Compétence supprimée"}


# ── Changement de mot de passe ────────────────────────────────────────────────

@router.post("/change-password", status_code=200)
async def change_password(
    data: ChangePasswordIn,
    user=Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    """Change le mot de passe du candidat connecté."""
    if not verify_password(data.current_password, user.hashed_pwd):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mot de passe actuel incorrect",
        )
    if len(data.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le nouveau mot de passe doit contenir au moins 8 caractères",
        )
    await user_repository.update(db, user, {"hashed_pwd": hash_password(data.new_password)})
    return {"message": "Mot de passe mis à jour"}


# ── Suppression du compte ─────────────────────────────────────────────────────

@router.delete("/account", status_code=200)
async def delete_account(
    user=Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    """Supprime définitivement le compte candidat et toutes ses données."""
    from sqlalchemy import delete as sql_delete, select as sql_select
    from app.models.db_models import CV, Competence, Experience, Resultat, Entretien

    candidate = await candidate_repository.get_by_email(db, user.email)
    if candidate:
        cv_ids_r = await db.execute(sql_select(CV.id).where(CV.id_candidate == candidate.id))
        cv_ids = cv_ids_r.scalars().all()

        if cv_ids:
            res_ids_r = await db.execute(sql_select(Resultat.id).where(Resultat.id_cv.in_(cv_ids)))
            res_ids = res_ids_r.scalars().all()
            if res_ids:
                await db.execute(sql_delete(Entretien).where(Entretien.id_resultat.in_(res_ids)))
            await db.execute(sql_delete(Resultat).where(Resultat.id_cv.in_(cv_ids)))
            await db.execute(sql_delete(Competence).where(Competence.id_cv.in_(cv_ids)))
            await db.execute(sql_delete(Experience).where(Experience.id_cv.in_(cv_ids)))
            await db.execute(sql_delete(CV).where(CV.id_candidate == candidate.id))

        await db.delete(candidate)  # cascades cover_letters + documents

    await db.delete(user)
    await db.commit()
    return {"message": "Compte supprimé"}
