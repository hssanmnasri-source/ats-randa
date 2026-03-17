"""
cv_tasks.py
Tâches Celery pour le traitement asynchrone des CVs.
"""
from app.core.celery_app import celery_app


@celery_app.task(name="tasks.embed_cv", bind=True, max_retries=3)
def embed_cv(self, cv_id: int) -> dict:
    """Génère et sauvegarde l'embedding d'un CV."""
    import asyncio
    from app.core.database import AsyncSessionLocal
    from app.repositories.cv_repository import get_by_id, update
    from app.nlp.embedder import encode, cv_to_embed_text
    from app.models.db_models import CVStatus

    async def _run():
        async with AsyncSessionLocal() as db:
            cv = await get_by_id(db, cv_id)
            if not cv:
                return {"status": "not_found", "cv_id": cv_id}
            if cv.embedding is not None:
                return {"status": "already_embedded", "cv_id": cv_id}

            embed_text = cv_to_embed_text(cv.cv_entities or {}, cv.cv_text or "")
            embedding  = encode(embed_text)
            await update(db, cv, {"embedding": embedding, "statut": CVStatus.INDEXED})
            return {"status": "ok", "cv_id": cv_id}

    try:
        return asyncio.run(_run())
    except Exception as exc:
        raise self.retry(exc=exc, countdown=10)


@celery_app.task(name="tasks.embed_all_cvs")
def embed_all_cvs(batch_size: int = 100) -> dict:
    """Génère les embeddings pour tous les CVs sans embedding (batch)."""
    import asyncio
    from app.core.database import AsyncSessionLocal
    from sqlalchemy import select
    from app.models.db_models import CV, CVStatus
    from app.nlp.embedder import encode_batch, cv_to_embed_text

    async def _run():
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

            texts   = [cv_to_embed_text(cv.cv_entities or {}, cv.cv_text or "") for cv in cvs]
            vectors = encode_batch(texts)

            for cv, vec in zip(cvs, vectors):
                cv.embedding = vec
            await db.commit()
            return {"status": "ok", "embedded": len(cvs)}

    return asyncio.run(_run())
