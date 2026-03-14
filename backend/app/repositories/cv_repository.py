from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from app.models.db_models import CV, CVStatus, CVSource, Competence, Experience, Resultat, SkillLevel, Candidate
from typing import Optional

async def create(db: AsyncSession, data: dict) -> CV:
    cv = CV(**data)
    db.add(cv)
    await db.commit()
    await db.refresh(cv)
    return cv

async def get_by_id(db: AsyncSession, cv_id: int) -> CV | None:
    result = await db.execute(
        select(CV).where(CV.id == cv_id)
    )
    return result.scalar_one_or_none()

async def update(db: AsyncSession, cv: CV, data: dict) -> CV:
    for key, value in data.items():
        setattr(cv, key, value)
    await db.commit()
    await db.refresh(cv)
    return cv

async def list_by_candidate(
    db: AsyncSession,
    candidate_id: int,
    skip: int = 0,
    limit: int = 20
) -> tuple[int, list[CV]]:
    query = select(CV).where(CV.id_candidate == candidate_id)

    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)

    query = query.offset(skip).limit(limit).order_by(CV.date_depot.desc())
    result = await db.execute(query)
    return total, result.scalars().all()

async def add_competences(db: AsyncSession, cv_id: int, competences: list[dict]) -> None:
    """Insère les compétences extraites pour un CV."""
    level_map = {
        "BEGINNER":     SkillLevel.BEGINNER,
        "INTERMEDIATE": SkillLevel.INTERMEDIATE,
        "EXPERT":       SkillLevel.EXPERT,
    }
    for comp in competences:
        nom = (comp.get("nom_competence") or "").strip()
        if not nom:
            continue
        niveau_str = (comp.get("niveau") or "INTERMEDIATE").upper()
        niveau = level_map.get(niveau_str, SkillLevel.INTERMEDIATE)
        db.add(Competence(id_cv=cv_id, nom_competence=nom, niveau=niveau))
    await db.commit()


async def add_experiences(db: AsyncSession, cv_id: int, experiences: list[dict]) -> None:
    """Insère les expériences professionnelles extraites pour un CV."""
    for exp in experiences:
        poste = (exp.get("poste") or "").strip()
        if not poste and not exp.get("entreprise"):
            continue
        db.add(Experience(
            id_cv=cv_id,
            poste=poste or None,
            entreprise=(exp.get("entreprise") or "").strip() or None,
            date_debut=exp.get("date_debut"),
            date_fin=exp.get("date_fin"),
            description=(exp.get("description") or "").strip() or None,
        ))
    await db.commit()


async def list_by_agent(
    db: AsyncSession,
    agent_id: int,
    statut: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
) -> tuple[int, list[CV]]:
    query = select(CV).where(CV.id_agent == agent_id)
    if statut:
        try:
            query = query.where(CV.statut == CVStatus(statut))
        except ValueError:
            pass  # Statut invalide → ignorer le filtre

    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)

    query = query.offset(skip).limit(limit).order_by(CV.date_depot.desc())
    result = await db.execute(query)
    return total, result.scalars().all()


async def list_all(
    db: AsyncSession,
    source: Optional[str] = None,
    statut: Optional[str] = None,
    search: Optional[str] = None,   # recherche sur nom/prenom/email du candidat
    skip: int = 0,
    limit: int = 20,
) -> tuple[int, list[CV]]:
    """Liste tous les CVs avec filtres optionnels, jointure sur le candidat pour la recherche."""
    query = select(CV).join(Candidate, CV.id_candidate == Candidate.id)

    if source:
        try:
            query = query.where(CV.source == CVSource(source))
        except ValueError:
            pass
    if statut:
        try:
            query = query.where(CV.statut == CVStatus(statut))
        except ValueError:
            pass
    if search:
        term = f"%{search}%"
        query = query.where(
            or_(
                Candidate.nom.ilike(term),
                Candidate.prenom.ilike(term),
                Candidate.email.ilike(term),
            )
        )

    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)

    query = query.offset(skip).limit(limit).order_by(CV.date_depot.desc())
    result = await db.execute(query)
    return total, result.scalars().all()


async def list_resultats(
    db: AsyncSession,
    candidate_id: int,
    skip: int = 0,
    limit: int = 20
) -> tuple[int, list[Resultat]]:
    # Jointure CV → Resultat pour ce candidat
    query = (
        select(Resultat)
        .join(CV, Resultat.id_cv == CV.id)
        .where(CV.id_candidate == candidate_id)
        .order_by(Resultat.date_analyse.desc())
    )

    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return total, result.scalars().all()