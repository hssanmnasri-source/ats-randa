"""
offer_tasks.py
Tâches Celery pour le traitement asynchrone des offres.
"""
from app.core.celery_app import celery_app


@celery_app.task(name="tasks.embed_offer", bind=True, max_retries=3)
def embed_offer(self, offer_id: int) -> dict:
    """Génère et sauvegarde l'embedding d'une offre."""
    import asyncio
    from app.core.database import AsyncSessionLocal
    from app.repositories.offer_repository import get_by_id, update
    from app.nlp.embedder import encode, offer_to_embed_text

    async def _run():
        async with AsyncSessionLocal() as db:
            offer = await get_by_id(db, offer_id)
            if not offer:
                return {"status": "not_found", "offer_id": offer_id}
            if offer.embedding is not None:
                return {"status": "already_embedded", "offer_id": offer_id}

            embedding = encode(offer_to_embed_text(offer))
            await update(db, offer, {"embedding": embedding})
            return {"status": "ok", "offer_id": offer_id}

    try:
        return asyncio.run(_run())
    except Exception as exc:
        raise self.retry(exc=exc, countdown=10)
