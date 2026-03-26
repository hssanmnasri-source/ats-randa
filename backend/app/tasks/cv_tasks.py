"""
cv_tasks.py
Tâches Celery pour le traitement asynchrone des CVs.

Flux principal (process_cv_on_upload) :
  1. Générer embedding
  2. Recalculer matching sur toutes les offres ACTIVE
  3. Mettre à jour UNIQUEMENT les résultats PENDING
     → RETAINED et REFUSED sont immuables (décision RH définitive)
"""
from __future__ import annotations
import asyncio
import logging

from app.core.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="tasks.embed_cv", bind=True, max_retries=3)
def embed_cv(self, cv_id: int) -> dict:
    """Génère et sauvegarde l'embedding d'un CV (tâche legacy)."""
    async def _run():
        from app.core.database import AsyncSessionLocal
        from app.repositories.cv_repository import get_by_id, update
        from app.nlp.embedder import encode, cv_to_embed_text
        from app.models.db_models import CVStatus

        async with AsyncSessionLocal() as db:
            cv = await get_by_id(db, cv_id)
            if not cv:
                return {"status": "not_found", "cv_id": cv_id}
            if cv.embedding is not None:
                return {"status": "already_embedded", "cv_id": cv_id}
            embed_text = cv_to_embed_text(cv.cv_entities or {}, cv.cv_text or "")
            embedding = encode(embed_text)
            await update(db, cv, {"embedding": embedding, "statut": CVStatus.INDEXED})
            return {"status": "ok", "cv_id": cv_id}

    try:
        return asyncio.run(_run())
    except Exception as exc:
        raise self.retry(exc=exc, countdown=10)


@celery_app.task(name="tasks.embed_all_cvs")
def embed_all_cvs(batch_size: int = 100) -> dict:
    """Génère les embeddings pour tous les CVs sans embedding (batch)."""
    async def _run():
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import select
        from app.models.db_models import CV, CVStatus
        from app.nlp.embedder import encode_batch, cv_to_embed_text

        async with AsyncSessionLocal() as db:
            rows = await db.execute(
                select(CV)
                .where(CV.embedding.is_(None))
                .where(CV.statut == CVStatus.INDEXED)
                .limit(batch_size)
            )
            cvs = rows.scalars().all()
            if not cvs:
                return {"status": "nothing_to_do", "embedded": 0}

            texts = [cv_to_embed_text(cv.cv_entities or {}, cv.cv_text or "") for cv in cvs]
            vectors = encode_batch(texts)

            for cv, vec in zip(cvs, vectors):
                cv.embedding = vec
            await db.commit()
            return {"status": "ok", "embedded": len(cvs)}

    return asyncio.run(_run())


@celery_app.task(
    name="tasks.process_cv_on_upload",
    bind=True,
    max_retries=3,
    default_retry_delay=60,
)
def process_cv_on_upload(self, cv_id: int) -> dict:
    """
    Tâche principale déclenchée après chaque upload ou modification de CV.

    Étapes :
      1. Générer le nouvel embedding + incrémenter cv_version
      2. Pour chaque offre ACTIVE :
         - RETAINED / REFUSED → skip (décision RH immuable)
         - PENDING existant   → mettre à jour les scores
         - Aucun résultat     → créer avec decision=PENDING
    """
    try:
        result = asyncio.run(_process_cv_async(cv_id))
        logger.info(f"✅ CV {cv_id} traité avec succès")
        return result
    except Exception as exc:
        logger.error(f"❌ Erreur traitement CV {cv_id}: {exc}")
        raise self.retry(exc=exc)


async def _process_cv_async(cv_id: int) -> dict:
    from datetime import datetime, timezone

    from sqlalchemy import select
    from sqlalchemy.orm import selectinload

    from app.core.database import AsyncSessionLocal
    from app.models.db_models import CV, CVStatus, Decision, JobOffer, OfferStatus, Resultat
    from app.nlp.embedder import cv_to_embed_text, encode
    from app.nlp.scorer import compute_final_score

    async with AsyncSessionLocal() as db:
        # ── 1. Charger le CV ────────────────────────────────────────────
        result = await db.execute(
            select(CV)
            .options(selectinload(CV.competences))
            .options(selectinload(CV.experiences))
            .where(CV.id == cv_id)
        )
        cv = result.scalar_one_or_none()

        if not cv:
            logger.error(f"CV {cv_id} introuvable")
            return {"status": "not_found", "cv_id": cv_id}

        # ── 2. Extraire texte PDF si cv_text absent ─────────────────────
        cv_text = cv.cv_text or ""
        if not cv_text.strip() and cv.fichier_pdf:
            try:
                import os
                from app.nlp.ocr import extract_text_from_pdf
                pdf_path = os.path.join("/app/uploads/cvs", cv.fichier_pdf)
                if os.path.exists(pdf_path):
                    with open(pdf_path, "rb") as f:
                        pdf_bytes = f.read()
                    cv_text = extract_text_from_pdf(pdf_bytes)
                    if cv_text:
                        cv.cv_text = cv_text
                        await db.commit()
                        logger.info(f"CV {cv_id} — texte extrait du PDF ({len(cv_text)} chars)")
            except Exception as e:
                logger.warning(f"CV {cv_id} — extraction PDF échouée: {e}")

        # ── 3. Parser le texte → cv_entities si absent ou vide ─────────
        if not cv.cv_entities and cv_text.strip():  # covers None and {}
            try:
                from app.nlp.general_cv_parser import parse_cv_text
                parsed = parse_cv_text(cv_text)
                if parsed:
                    cv.cv_entities = parsed
                    await db.commit()
                    logger.info(
                        f"CV {cv_id} — entités extraites : "
                        f"{list(parsed.keys())}"
                    )
            except Exception as e:
                logger.warning(f"CV {cv_id} — parsing général échoué: {e}")

        # ── 4. Construire texte + générer embedding ─────────────────────
        embed_text = cv_to_embed_text(cv.cv_entities or {}, cv_text)
        if not embed_text.strip():
            logger.warning(f"CV {cv_id} — texte vide, embedding impossible")
            return {"status": "empty_text", "cv_id": cv_id}

        logger.info(f"Génération embedding CV {cv_id}...")
        embedding = encode(embed_text)

        cv.embedding = embedding
        cv.statut = CVStatus.INDEXED
        cv.cv_version = (cv.cv_version or 0) + 1
        await db.commit()
        await db.refresh(cv)
        logger.info(f"Embedding CV {cv_id} sauvegardé (version {cv.cv_version})")

        # ── 5. Récupérer toutes les offres ACTIVE ───────────────────────
        offers_result = await db.execute(
            select(JobOffer).where(JobOffer.statut == OfferStatus.ACTIVE)
        )
        active_offers = offers_result.scalars().all()

        if not active_offers:
            logger.info(f"CV {cv_id} — aucune offre active")
            return {"status": "no_active_offers", "cv_id": cv_id, "cv_version": cv.cv_version}

        logger.info(f"CV {cv_id} — matching contre {len(active_offers)} offres actives")

        # ── 4. Préparer données scoring du CV ───────────────────────────
        entities = cv.cv_entities or {}

        # ── 5. Boucle offres ────────────────────────────────────────────
        import numpy as np
        cv_arr = np.array(embedding, dtype=np.float32)

        updated = created = skipped_rh = 0
        now = datetime.now(timezone.utc)

        for offer in active_offers:
            try:
                # Similarité cosinus en Python — les embeddings sont normalisés,
                # donc dot product = cosinus similarity
                cosine_sim = 0.0
                if offer.embedding is not None:
                    off_arr = np.array(list(offer.embedding), dtype=np.float32)
                    cosine_sim = float(np.dot(cv_arr, off_arr))

                scores = compute_final_score(
                    cosine_sim=cosine_sim,
                    cv_entities=entities,
                    required_skills=offer.competences_requises or [],
                    required_years=float(offer.experience_requise or 0),
                    required_langue=offer.langue_requise or "fr",
                )

                # Chercher résultat existant pour ce couple (cv, offre)
                existing = await db.execute(
                    select(Resultat).where(
                        Resultat.id_cv == cv_id,
                        Resultat.id_offre == offer.id,
                    )
                )
                resultat = existing.scalar_one_or_none()

                if resultat:
                    # ══ RÈGLE MÉTIER CRITIQUE ══════════════════════════
                    # Décision RETAINED ou REFUSED = immuable
                    if resultat.decision in (Decision.RETAINED, Decision.REFUSED):
                        logger.debug(
                            f"CV {cv_id} / Offre {offer.id} — "
                            f"décision {resultat.decision.value} conservée (non recalculée)"
                        )
                        skipped_rh += 1
                        continue

                    # Mettre à jour le résultat PENDING
                    resultat.score_matching = scores["score_matching"]
                    resultat.score_skills = scores["score_skills"]
                    resultat.score_experience = scores["score_experience"]
                    resultat.score_langue = scores["score_langue"]
                    resultat.score_final = scores["score_final"]
                    resultat.last_score_updated_at = now
                    updated += 1

                else:
                    # Créer un nouveau résultat PENDING
                    db.add(Resultat(
                        id_cv=cv_id,
                        id_offre=offer.id,
                        score_matching=scores["score_matching"],
                        score_skills=scores["score_skills"],
                        score_experience=scores["score_experience"],
                        score_langue=scores["score_langue"],
                        score_final=scores["score_final"],
                        decision=Decision.PENDING,
                        last_score_updated_at=now,
                    ))
                    created += 1

            except Exception as e:
                logger.error(f"Erreur scoring CV {cv_id} / Offre {offer.id}: {e}")
                continue

        await db.commit()
        logger.info(
            f"✅ CV {cv_id} v{cv.cv_version} — "
            f"{created} créés, {updated} mis à jour, {skipped_rh} décisions RH conservées"
        )
        return {
            "status": "ok",
            "cv_id": cv_id,
            "cv_version": cv.cv_version,
            "offers_processed": len(active_offers),
            "created": created,
            "updated": updated,
            "skipped_rh_decisions": skipped_rh,
        }
