"""
embed_existing_cvs.py
Script CLI pour générer les embeddings des CVs existants sans embedding.

Usage (depuis le container) :
  python -m app.nlp.embed_existing_cvs
  python -m app.nlp.embed_existing_cvs --batch-size 64 --limit 500
"""
import asyncio
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

from loguru import logger
from sqlalchemy import select, func

from app.core.database import AsyncSessionLocal
from app.models.db_models import CV, CVStatus
from app.nlp.embedder import encode_batch, cv_to_embed_text


async def embed_existing(batch_size: int = 64, limit: int | None = None) -> None:
    async with AsyncSessionLocal() as db:
        # Compter les CVs sans embedding
        total_q = select(func.count()).select_from(CV).where(CV.embedding.is_(None))
        total = await db.scalar(total_q)
        logger.info(f"CVs sans embedding : {total}")

        if total == 0:
            logger.success("Tous les CVs ont déjà un embedding ✓")
            return

        to_process = min(total, limit) if limit else total
        logger.info(f"À traiter : {to_process} (batch_size={batch_size})")

        done = 0
        errors = 0

        # Pas d'offset : après chaque commit, les CVs traités disparaissent
        # du WHERE embedding IS NULL → toujours query offset=0
        while done < to_process:
            q = (
                select(CV)
                .where(CV.embedding.is_(None))
                .where(CV.statut == CVStatus.INDEXED)
                .order_by(CV.id)
                .limit(batch_size)
            )
            rows = await db.execute(q)
            batch = rows.scalars().all()

            if not batch:
                break

            texts = [cv_to_embed_text(cv.cv_entities or {}, cv.cv_text or "") for cv in batch]

            try:
                vectors = encode_batch(texts, batch_size=batch_size)
                for cv, vec in zip(batch, vectors):
                    cv.embedding = vec
                await db.commit()
                done += len(batch)
                logger.info(f"  [{done}/{to_process}] batch OK")
            except Exception as e:
                errors += len(batch)
                logger.error(f"  Batch échoué : {e}")
                await db.rollback()
                break  # éviter boucle infinie si le batch plante toujours

    logger.info("=" * 50)
    logger.success(f"✓ Embeddings générés : {done}")
    if errors:
        logger.error(f"✗ Erreurs            : {errors}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Générer les embeddings des CVs existants")
    parser.add_argument("--batch-size", type=int, default=64, metavar="N")
    parser.add_argument("--limit", type=int, default=None, metavar="N",
                        help="Limiter le nombre de CVs traités (test)")
    args = parser.parse_args()

    asyncio.run(embed_existing(batch_size=args.batch_size, limit=args.limit))


if __name__ == "__main__":
    main()
