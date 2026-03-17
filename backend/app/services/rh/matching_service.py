"""
matching_service.py
Orchestration du matching CV ↔ Offre via pgvector + scoring multi-critères.

Flux :
  1. Charger l'offre (générer embedding si absent)
  2. Requête pgvector : top N CVs les plus proches (cosinus)
  3. Scoring multi-critères pour chaque CV
  4. Classer par score_final, assigner rang
  5. Stocker dans table resultats, retourner résultats
"""
from __future__ import annotations
import json

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from loguru import logger

from app.models.db_models import JobOffer, CVStatus
from app.nlp.embedder import encode, offer_to_embed_text
from app.nlp.scorer import compute_final_score
from app.repositories import result_repository, offer_repository

# CVs pré-sélectionnés par pgvector avant scoring fin (> top_n pour avoir de la marge)
_PGVECTOR_POOL = 200


async def _ensure_offer_embedding(db: AsyncSession, offer: JobOffer) -> list[float]:
    """Génère et sauvegarde l'embedding de l'offre si absent."""
    if offer.embedding is not None:
        return list(offer.embedding)
    embedding = encode(offer_to_embed_text(offer))
    await offer_repository.update(db, offer, {"embedding": embedding})
    logger.info(f"Embedding généré pour l'offre #{offer.id}")
    return embedding


async def run_matching(
    db: AsyncSession,
    offer_id: int,
    top_n: int = 50,
    force: bool = False,
) -> list[dict]:
    """
    Lance le matching pour une offre et retourne les top_n résultats.

    Args:
        offer_id : ID de l'offre
        top_n    : Nombre de CVs dans les résultats finaux
        force    : True = supprime anciens résultats et relance

    Returns:
        Liste de dicts triée par score_final décroissant
    """
    offer = await offer_repository.get_by_id(db, offer_id)
    if not offer:
        raise ValueError(f"Offre #{offer_id} introuvable")

    # Résultats existants → retourner directement sauf si force=True
    if not force:
        total, existing = await result_repository.list_by_offer(db, offer_id, limit=1)
        if total > 0:
            logger.info(f"Offre #{offer_id} : {total} résultats en DB (force=False)")
            _, rows = await result_repository.list_by_offer(db, offer_id, limit=top_n)
            return [_row_to_dict(r) for r in rows]

    # Embedding de l'offre
    offer_vec = await _ensure_offer_embedding(db, offer)
    vec_str = "[" + ",".join(str(x) for x in offer_vec) + "]"

    # Requête pgvector — cosinus = 1 - distance (<=>)
    sql = text("""
        SELECT
            c.id                                         AS cv_id,
            c.id_candidate,
            c.cv_entities,
            1 - (c.embedding <=> CAST(:vec AS vector))  AS cosine_sim
        FROM cvs c
        WHERE c.embedding IS NOT NULL
          AND c.statut = 'INDEXED'
        ORDER BY c.embedding <=> CAST(:vec AS vector)
        LIMIT :lim
    """)
    rows = await db.execute(sql, {"vec": vec_str, "lim": _PGVECTOR_POOL})
    candidates = rows.fetchall()

    if not candidates:
        logger.warning(f"Offre #{offer_id} : aucun CV avec embedding")
        return []

    logger.info(f"Offre #{offer_id} : {len(candidates)} candidats pgvector → scoring")

    required_skills = offer.competences_requises or []
    required_years  = float(offer.experience_requise or 0)
    required_langue = offer.langue_requise

    scored: list[dict] = []
    for row in candidates:
        entities = row.cv_entities or {}
        if isinstance(entities, str):
            entities = json.loads(entities)

        scores = compute_final_score(
            cosine_sim=float(row.cosine_sim),
            cv_entities=entities,
            required_skills=required_skills,
            required_years=required_years,
            required_langue=required_langue,
        )
        scored.append({
            "id_cv":        row.cv_id,
            "id_offre":     offer_id,
            "id_candidate": row.id_candidate,
            **scores,
        })

    # Trier, garder top_n, assigner rang
    scored.sort(key=lambda x: x["score_final"], reverse=True)
    top = scored[:top_n]
    for rang, item in enumerate(top, 1):
        item["rang"] = rang

    # Supprimer anciens + insérer nouveaux
    await result_repository.delete_by_offer(db, offer_id)
    await result_repository.create_many(db, [
        {
            "id_cv":           item["id_cv"],
            "id_offre":        item["id_offre"],
            "score_matching":  item["score_matching"],
            "score_skills":    item["score_skills"],
            "score_experience": item["score_experience"],
            "score_langue":    item["score_langue"],
            "score_final":     item["score_final"],
            "rang":            item["rang"],
        }
        for item in top
    ])
    logger.success(f"Offre #{offer_id} : {len(top)} résultats stockés")
    return top


def _row_to_dict(r) -> dict:
    return {
        "id":               r.id,
        "id_cv":            r.id_cv,
        "id_offre":         r.id_offre,
        "score_matching":   r.score_matching,
        "score_skills":     r.score_skills,
        "score_experience": r.score_experience,
        "score_langue":     r.score_langue,
        "score_final":      r.score_final,
        "rang":             r.rang,
        "decision":         r.decision.value if r.decision else "PENDING",
    }
