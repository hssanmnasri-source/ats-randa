from fastapi import APIRouter, Depends, Query, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, func
from typing import Optional
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field, validator
from app.core.database import get_db
from app.api.dependencies import require_rh
from app.models.schemas.rh_schemas import (
    OfferCreateIn, OfferUpdateIn, OfferOut, OfferListOut
)
from app.models.db_models import JobOffer, Resultat, Decision, CV, Candidate
from app.services.rh import offer_service

router = APIRouter(
    prefix="/api/rh",
    tags=["💼 RH — Offres d'emploi"],
)

@router.get("/offers", response_model=OfferListOut)
async def list_offers(
    statut:    Optional[str] = Query(None),
    page:      int           = Query(1, ge=1),
    limit:     int           = Query(20, ge=1, le=100),
    rh        = Depends(require_rh),
    db: AsyncSession = Depends(get_db)
):
    return await offer_service.list_rh_offers(
        db, rh.id, statut, page, limit
    )

@router.post("/offers", response_model=OfferOut, status_code=201)
async def create_offer(
    data: OfferCreateIn,
    rh        = Depends(require_rh),
    db: AsyncSession = Depends(get_db)
):
    return await offer_service.create_offer(db, data, rh.id)

@router.get("/offers/{offer_id}", response_model=OfferOut)
async def get_offer(
    offer_id: int,
    rh        = Depends(require_rh),
    db: AsyncSession = Depends(get_db)
):
    return await offer_service.get_offer(db, offer_id)

@router.put("/offers/{offer_id}", response_model=OfferOut)
async def update_offer(
    offer_id: int,
    data: OfferUpdateIn,
    rh        = Depends(require_rh),
    db: AsyncSession = Depends(get_db)
):
    return await offer_service.update_offer(db, offer_id, data, rh.id)

@router.delete("/offers/{offer_id}", response_model=OfferOut)
async def archive_offer(
    offer_id: int,
    rh        = Depends(require_rh),
    db: AsyncSession = Depends(get_db)
):
    return await offer_service.archive_offer(db, offer_id, rh.id)


@router.put("/offers/{offer_id}/seuil")
async def set_seuil_alerte(
    offer_id: int,
    seuil: int = Body(..., ge=1, le=10000, embed=True),
    matching_auto: bool = Body(False, embed=True),
    rh=Depends(require_rh),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(JobOffer).where(JobOffer.id == offer_id, JobOffer.id_rh == rh.id)
    )
    offer = result.scalar_one_or_none()
    if not offer:
        raise HTTPException(404, "Offre introuvable")
    offer.seuil_alerte = seuil
    offer.matching_auto = matching_auto
    offer.alerte_envoyee = False
    await db.commit()
    return {"offre_id": offer_id, "seuil_alerte": seuil, "matching_auto": matching_auto}


class PoidsIn(BaseModel):
    poids_semantique:  float = Field(..., ge=0.0, le=1.0)
    poids_competences: float = Field(..., ge=0.0, le=1.0)
    poids_experience:  float = Field(..., ge=0.0, le=1.0)
    poids_langue:      float = Field(..., ge=0.0, le=1.0)

    @validator('poids_langue')
    def check_total(cls, v, values):
        total = (
            values.get('poids_semantique', 0) +
            values.get('poids_competences', 0) +
            values.get('poids_experience', 0) + v
        )
        if abs(total - 1.0) > 0.05:
            raise ValueError(f'La somme des poids doit être 100% (actuel: {total*100:.1f}%)')
        return v


@router.put("/offers/{offer_id}/poids")
async def update_poids_scoring(
    offer_id: int,
    data: PoidsIn,
    rh=Depends(require_rh),
    db: AsyncSession = Depends(get_db)
):
    """Met à jour les poids du scoring pour cette offre."""
    result = await db.execute(
        select(JobOffer).where(JobOffer.id == offer_id, JobOffer.id_rh == rh.id)
    )
    offer = result.scalar_one_or_none()
    if not offer:
        raise HTTPException(404, "Offre introuvable")

    offer.poids_semantique  = data.poids_semantique
    offer.poids_competences = data.poids_competences
    offer.poids_experience  = data.poids_experience
    offer.poids_langue      = data.poids_langue
    await db.commit()
    return {
        "message": "Poids mis à jour — relancez le matching pour recalculer",
        "poids": {
            "semantique":  data.poids_semantique,
            "competences": data.poids_competences,
            "experience":  data.poids_experience,
            "langue":      data.poids_langue,
        }
    }


_TRANSITIONS_RH = {
    "BROUILLON":     ["EN_VALIDATION", "ARCHIVEE", "ARCHIVED"],
    "EN_VALIDATION": ["BROUILLON", "ARCHIVEE", "ARCHIVED"],
    "PROCHAINEMENT": ["ACTIVE", "DESACTIVEE", "ARCHIVEE", "ARCHIVED"],
    "ACTIVE":        ["DESACTIVEE", "ARCHIVEE", "ARCHIVED"],
    "INACTIVE":      ["ACTIVE", "ARCHIVEE", "ARCHIVED"],
    "DESACTIVEE":    ["ACTIVE", "ARCHIVEE", "ARCHIVED"],
    "EXPIREE":       ["ARCHIVEE", "ARCHIVED"],
    "REFUSEE":       ["BROUILLON"],
    "ARCHIVED":      [],
    "ARCHIVEE":      [],
}


@router.patch("/offers/{offer_id}/statut")
async def update_offer_statut(
    offer_id: int,
    statut: str = Body(..., embed=True),
    raison: Optional[str] = Body(None, embed=True),
    rh=Depends(require_rh),
    db: AsyncSession = Depends(get_db)
):
    """Change le statut d'une offre avec validation des transitions."""
    result = await db.execute(
        select(JobOffer).where(JobOffer.id == offer_id, JobOffer.id_rh == rh.id)
    )
    offer = result.scalar_one_or_none()
    if not offer:
        raise HTTPException(404, "Offre introuvable")

    statut_actuel = offer.statut.value if hasattr(offer.statut, 'value') else str(offer.statut)
    transitions = _TRANSITIONS_RH.get(statut_actuel, [])

    if statut not in transitions:
        raise HTTPException(400,
            f"Transition '{statut_actuel}' → '{statut}' non autorisée. "
            f"Transitions possibles : {transitions}"
        )

    offer.statut = statut
    if raison:
        offer.raison_refus = raison
    if statut == "ACTIVE":
        offer.date_mise_en_ligne = datetime.now(timezone.utc)
    await db.commit()

    return {
        "success": True,
        "ancien_statut": statut_actuel,
        "nouveau_statut": statut,
    }


@router.get("/offers/{offer_id}/stats")
async def get_offer_stats(
    offer_id: int,
    jours: int = Query(30, ge=7, le=90),
    rh=Depends(require_rh),
    db: AsyncSession = Depends(get_db)
):
    """Statistiques détaillées d'une offre (style Keejob)."""
    offer = await db.scalar(select(JobOffer).where(JobOffer.id == offer_id))
    if not offer:
        raise HTTPException(404, "Offre introuvable")

    now = datetime.now(timezone.utc)
    since = now - timedelta(days=jours)

    # Courbe candidatures par jour
    daily_rows = (await db.execute(text("""
        SELECT DATE(date_analyse) AS jour, COUNT(*) AS candidatures
        FROM resultats
        WHERE id_offre = :offer_id AND date_analyse >= :since
        GROUP BY DATE(date_analyse)
        ORDER BY jour
    """), {"offer_id": offer_id, "since": since})).fetchall()

    courbe = [
        {"date": str(r.jour), "candidatures": r.candidatures, "vues": r.candidatures * 3}
        for r in daily_rows
    ]

    # Répartition par région
    regions_rows = (await db.execute(text("""
        SELECT COALESCE(c.region, 'Non renseigné') AS region, COUNT(*) AS nb
        FROM resultats r
        JOIN cvs cv ON cv.id = r.id_cv
        JOIN candidates c ON c.id = cv.id_candidate
        WHERE r.id_offre = :offer_id
        GROUP BY c.region ORDER BY nb DESC LIMIT 15
    """), {"offer_id": offer_id})).fetchall()

    total_reg = sum(r.nb for r in regions_rows) or 1
    regions = [
        {"region": r.region, "count": r.nb, "pct": round(r.nb / total_reg * 100, 1)}
        for r in regions_rows
    ]

    # Niveaux d'étude
    etude_rows = (await db.execute(text("""
        SELECT COALESCE(c.niveau_etude, 'Non renseigné') AS niveau, COUNT(*) AS nb
        FROM resultats r
        JOIN cvs cv ON cv.id = r.id_cv
        JOIN candidates c ON c.id = cv.id_candidate
        WHERE r.id_offre = :offer_id
        GROUP BY c.niveau_etude ORDER BY nb DESC
    """), {"offer_id": offer_id})).fetchall()

    total_etude = sum(r.nb for r in etude_rows) or 1
    niveaux_etude = [
        {"niveau": r.niveau, "count": r.nb, "pct": round(r.nb / total_etude * 100, 1)}
        for r in etude_rows
    ]

    # Niveaux d'expérience
    exp_rows = (await db.execute(text("""
        SELECT COALESCE(c.niveau_experience, 'Non renseigné') AS niveau, COUNT(*) AS nb
        FROM resultats r
        JOIN cvs cv ON cv.id = r.id_cv
        JOIN candidates c ON c.id = cv.id_candidate
        WHERE r.id_offre = :offer_id
        GROUP BY c.niveau_experience ORDER BY nb DESC
    """), {"offer_id": offer_id})).fetchall()

    total_exp = sum(r.nb for r in exp_rows) or 1
    niveaux_experience = [
        {"niveau": r.niveau, "count": r.nb, "pct": round(r.nb / total_exp * 100, 1)}
        for r in exp_rows
    ]

    # Résumé
    total_cand = await db.scalar(
        select(func.count(Resultat.id)).where(Resultat.id_offre == offer_id)
    ) or 0
    retenus = await db.scalar(
        select(func.count(Resultat.id)).where(
            Resultat.id_offre == offer_id, Resultat.decision == Decision.RETAINED
        )
    ) or 0
    score_moyen = await db.scalar(
        select(func.avg(Resultat.score_final)).where(Resultat.id_offre == offer_id)
    )

    return {
        "courbe": courbe,
        "regions": regions,
        "niveaux_etude": niveaux_etude,
        "niveaux_experience": niveaux_experience,
        "resume": {
            "total_candidatures": total_cand,
            "retenus": retenus,
            "taux_retention": round(retenus / total_cand * 100, 1) if total_cand > 0 else 0,
            "score_moyen": round(float(score_moyen or 0) * 100, 1),
        }
    }


@router.post("/offers/{offer_id}/reset-alerte")
async def reset_alerte(
    offer_id: int,
    rh=Depends(require_rh),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(JobOffer).where(JobOffer.id == offer_id, JobOffer.id_rh == rh.id)
    )
    offer = result.scalar_one_or_none()
    if not offer:
        raise HTTPException(404, "Offre introuvable")
    offer.alerte_envoyee = False
    await db.commit()
    return {"message": "Alerte reinitialisee"}