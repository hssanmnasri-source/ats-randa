"""
result_repository.py
Accès base de données pour la table resultats.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from sqlalchemy.orm import joinedload
from app.models.db_models import Resultat, Decision, CV, Candidate


async def create_many(db: AsyncSession, rows: list[dict]) -> None:
    """Insère plusieurs résultats en une seule transaction."""
    for row in rows:
        db.add(Resultat(**row))
    await db.commit()


async def list_by_offer(
    db: AsyncSession,
    offer_id: int,
    decision: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> tuple[int, list[dict]]:
    """Returns list of result dicts enriched with candidate info."""
    query = (
        select(Resultat, CV, Candidate)
        .join(CV, CV.id == Resultat.id_cv)
        .join(Candidate, Candidate.id == CV.id_candidate)
        .where(Resultat.id_offre == offer_id)
    )

    if decision:
        query = query.where(Resultat.decision == decision)

    count_q = select(func.count()).select_from(
        select(Resultat).where(Resultat.id_offre == offer_id).subquery()
    )
    total = await db.scalar(count_q)

    rows = await db.execute(
        query.order_by(Resultat.rang).offset(skip).limit(limit)
    )

    results = []
    for r, cv, cand in rows.all():
        results.append({
            "id": r.id,
            "id_cv": r.id_cv,
            "rang": r.rang,
            "score_final": r.score_final,
            "score_matching": r.score_matching,
            "score_skills": r.score_skills,
            "score_experience": r.score_experience,
            "score_langue": r.score_langue,
            "decision": r.decision.value if r.decision else "PENDING",
            "date_analyse": r.date_analyse.isoformat() if r.date_analyse else None,
            "candidat_nom": cand.nom,
            "candidat_prenom": cand.prenom,
            "candidat_email": cand.email,
            "candidat_telephone": cand.telephone,
        })
    return total, results


async def get_by_id(db: AsyncSession, result_id: int) -> Resultat | None:
    r = await db.execute(select(Resultat).where(Resultat.id == result_id))
    return r.scalar_one_or_none()


async def update_decision(
    db: AsyncSession,
    result: Resultat,
    decision: Decision,
) -> Resultat:
    result.decision = decision
    await db.commit()
    await db.refresh(result)
    return result


async def delete_by_offer(db: AsyncSession, offer_id: int) -> int:
    """Supprime tous les résultats d'une offre (avant re-matching)."""
    r = await db.execute(
        delete(Resultat).where(Resultat.id_offre == offer_id)
    )
    await db.commit()
    return r.rowcount


async def delete_pending_by_offer(db: AsyncSession, offer_id: int) -> int:
    """Supprime uniquement les résultats PENDING d'une offre.
    Préserve RETAINED et REFUSED — règle métier : décisions RH immuables.
    """
    r = await db.execute(
        delete(Resultat).where(
            Resultat.id_offre == offer_id,
            Resultat.decision == Decision.PENDING,
        )
    )
    await db.commit()
    return r.rowcount


async def get_by_cv_offer(
    db: AsyncSession, cv_id: int, offer_id: int
) -> Resultat | None:
    """Retourne le résultat pour un couple (cv_id, offer_id), ou None."""
    r = await db.execute(
        select(Resultat).where(
            Resultat.id_cv == cv_id,
            Resultat.id_offre == offer_id,
        )
    )
    return r.scalar_one_or_none()
