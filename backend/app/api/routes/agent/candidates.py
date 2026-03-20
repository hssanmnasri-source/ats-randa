from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select
from typing import Optional

from app.core.database import get_db
from app.api.dependencies import require_agent
from app.models.db_models import Candidate
from app.models.schemas.agent_schemas import CandidateOut, CandidateListOut
from app.repositories import candidate_repository

router = APIRouter(
    prefix="/api/agent",
    tags=["👤 Agent — Candidats"],
)


@router.get("/candidates", response_model=CandidateListOut)
async def list_candidates(
    search: Optional[str] = Query(None, description="Recherche nom / prénom / email"),
    page:   int = Query(1, ge=1),
    limit:  int = Query(20, ge=1, le=100),
    agent=Depends(require_agent),
    db: AsyncSession = Depends(get_db),
):
    """
    Liste les candidats dont les CVs ont été uploadés par cet agent.
    Les candidats importés en masse (Keejob bulk) n'apparaissent pas ici
    car ils ne sont pas attribués à un agent spécifique.
    """
    skip = (page - 1) * limit
    total, candidates = await candidate_repository.list_all(
        db, search=search, agent_id=agent.id, skip=skip, limit=limit
    )
    return CandidateListOut(
        total=total,
        page=page,
        pages=max(1, -(-total // limit)),
        candidates=candidates,
    )


@router.get("/candidates/{candidate_id}")
async def get_candidate(
    candidate_id: int,
    agent=Depends(require_agent),
    db: AsyncSession = Depends(get_db),
):
    """Détail d'un candidat avec la liste de ses CVs."""
    result = await db.execute(
        select(Candidate)
        .options(selectinload(Candidate.cvs))
        .where(Candidate.id == candidate_id)
    )
    candidate = result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidat introuvable")

    return {
        "id":             candidate.id,
        "nom":            candidate.nom,
        "prenom":         candidate.prenom,
        "email":          candidate.email,
        "telephone":      candidate.telephone,
        "adresse":        candidate.adresse,
        "date_naissance": candidate.date_naissance,
        "created_at":     candidate.created_at,
        "nb_cvs":         len(candidate.cvs),
        "cvs": [
            {
                "id":          cv.id,
                "statut":      cv.statut.value,
                "source":      cv.source.value,
                "date_depot":  cv.date_depot,
                "fichier_pdf": cv.fichier_pdf,
            }
            for cv in sorted(candidate.cvs, key=lambda c: c.date_depot, reverse=True)
        ],
    }
