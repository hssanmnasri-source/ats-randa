from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta
from typing import List, Optional
from app.core.database import get_db
from app.api.dependencies import require_rh
from app.models.db_models import Entretien, Resultat, CV, Candidate, JobOffer, Decision, User
from app.models.schemas.calendar_schemas import (
    EntretienUpdateIn, PlanifierEntretiensIn,
    PlanifierResponse, CreneauxSuggeres
)
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/rh", tags=["RH — Calendrier"])


@router.get("/calendar")
async def get_calendar(
    date_debut: Optional[datetime] = None,
    date_fin: Optional[datetime] = None,
    rh=Depends(require_rh),
    db: AsyncSession = Depends(get_db)
):
    query = select(Entretien).where(Entretien.id_rh == rh.id)
    if date_debut:
        query = query.where(Entretien.date_entretien >= date_debut)
    if date_fin:
        query = query.where(Entretien.date_entretien <= date_fin)
    query = query.order_by(Entretien.date_entretien.asc())
    result = await db.execute(query)
    entretiens = result.scalars().all()
    return {
        "total": len(entretiens),
        "entretiens": [await _enrich_entretien(db, e) for e in entretiens]
    }


@router.post("/calendar/planifier")
async def planifier_entretiens(
    data: PlanifierEntretiensIn,
    rh=Depends(require_rh),
    db: AsyncSession = Depends(get_db)
):
    resultats_result = await db.execute(
        select(Resultat)
        .options(selectinload(Resultat.cv).selectinload(CV.candidate))
        .where(
            Resultat.id_offre == data.id_offre,
            Resultat.decision == Decision.RETAINED,
        )
        .order_by(Resultat.score_final.desc())
        .limit(data.top_n)
    )
    resultats = resultats_result.scalars().all()

    if not resultats:
        return {"creneaux": [], "message": "Aucun candidat retenu pour cette offre"}

    creneaux = []
    creneau_actuel = data.date_debut

    for i, resultat in enumerate(resultats):
        candidate = resultat.cv.candidate if resultat.cv else None
        if not candidate:
            continue

        creneaux.append(CreneauxSuggeres(
            candidat_id=candidate.id,
            candidat_nom=candidate.nom or "?",
            candidat_prenom=candidate.prenom or "?",
            candidat_email=candidate.email or "",
            score_final=resultat.score_final,
            rang=i + 1,
            creneau_suggere=creneau_actuel,
            id_resultat=resultat.id,
        ))
        creneau_actuel += timedelta(minutes=data.intervalle_minutes)

    return PlanifierResponse(
        creneaux=creneaux,
        message=f"{len(creneaux)} creneaux suggeres"
    )


@router.post("/calendar/confirmer")
async def confirmer_entretiens(
    id_offre: int,
    creneaux: List[dict],
    lieu: str = "RANDA — ZI BIR EL KASAA BEN AROUS",
    type_entretien: str = "presentiel",
    duree_minutes: int = 30,
    envoyer_emails: bool = True,
    rh=Depends(require_rh),
    db: AsyncSession = Depends(get_db)
):
    entretiens_crees = []

    for creneau in creneaux:
        date_str = creneau.get("creneau_suggere") or creneau.get("date_entretien")
        if isinstance(date_str, str):
            date_entretien = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        else:
            date_entretien = date_str

        entretien = Entretien(
            id_resultat=creneau.get("id_resultat"),
            id_offre=id_offre,
            id_rh=rh.id,
            date_entretien=date_entretien,
            duree_minutes=duree_minutes,
            lieu=lieu,
            type_entretien=type_entretien,
            statut="PLANIFIE",
        )
        db.add(entretien)
        entretiens_crees.append({
            "candidat_nom": creneau.get("candidat_nom"),
            "candidat_email": creneau.get("candidat_email"),
            "date": date_entretien.isoformat(),
        })

    await db.commit()

    if envoyer_emails:
        from app.core.mailer import send_entretien_invitation
        offre_result = await db.execute(select(JobOffer).where(JobOffer.id == id_offre))
        offre = offre_result.scalar_one_or_none()

        for creneau in creneaux:
            email = creneau.get("candidat_email")
            if email:
                try:
                    await send_entretien_invitation(
                        candidat_email=email,
                        candidat_nom=f"{creneau.get('candidat_prenom', '')} {creneau.get('candidat_nom', '')}",
                        offre_titre=offre.titre if offre else "Poste RANDA",
                        date_entretien=creneau.get("creneau_suggere"),
                        lieu=lieu,
                        type_entretien=type_entretien,
                        rh_nom=f"{rh.prenom} {rh.nom}",
                        rh_email=rh.email,
                    )
                except Exception as e:
                    logger.error(f"Error sending entretien email {email}: {e}")

    return {
        "success": True,
        "nb_entretiens": len(entretiens_crees),
        "entretiens": entretiens_crees,
        "message": f"{len(entretiens_crees)} entretiens planifies"
    }


@router.put("/calendar/{entretien_id}")
async def update_entretien(
    entretien_id: int,
    data: EntretienUpdateIn,
    rh=Depends(require_rh),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Entretien).where(Entretien.id == entretien_id, Entretien.id_rh == rh.id)
    )
    entretien = result.scalar_one_or_none()
    if not entretien:
        raise HTTPException(404, "Entretien introuvable")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(entretien, field, value)
    await db.commit()
    return {"success": True, "message": "Entretien mis a jour"}


@router.delete("/calendar/{entretien_id}")
async def cancel_entretien(
    entretien_id: int,
    rh=Depends(require_rh),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Entretien).where(Entretien.id == entretien_id, Entretien.id_rh == rh.id)
    )
    entretien = result.scalar_one_or_none()
    if not entretien:
        raise HTTPException(404, "Entretien introuvable")
    entretien.statut = "ANNULE"
    await db.commit()
    return {"success": True, "message": "Entretien annule"}


async def _enrich_entretien(db, entretien) -> dict:
    offre_result = await db.execute(select(JobOffer).where(JobOffer.id == entretien.id_offre))
    offre = offre_result.scalar_one_or_none()

    candidat_nom = candidat_prenom = candidat_email = None
    if entretien.id_resultat:
        res = await db.execute(
            select(Resultat)
            .options(selectinload(Resultat.cv).selectinload(CV.candidate))
            .where(Resultat.id == entretien.id_resultat)
        )
        resultat = res.scalar_one_or_none()
        if resultat and resultat.cv and resultat.cv.candidate:
            c = resultat.cv.candidate
            candidat_nom = c.nom
            candidat_prenom = c.prenom
            candidat_email = c.email

    return {
        "id": entretien.id,
        "id_offre": entretien.id_offre,
        "offre_titre": offre.titre if offre else None,
        "date_entretien": entretien.date_entretien.isoformat(),
        "duree_minutes": entretien.duree_minutes,
        "lieu": entretien.lieu,
        "type_entretien": entretien.type_entretien,
        "lien_visio": entretien.lien_visio,
        "notes_rh": entretien.notes_rh,
        "statut": entretien.statut,
        "candidat_nom": candidat_nom,
        "candidat_prenom": candidat_prenom,
        "candidat_email": candidat_email,
        "email_candidat_envoye": entretien.email_candidat_envoye,
    }
