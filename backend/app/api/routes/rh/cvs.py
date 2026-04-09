from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.core.database import get_db
from app.api.dependencies import require_rh

router = APIRouter(
    prefix="/api/rh",
    tags=["📊 RH — Dashboard"],
)


@router.get("/cvs/search")
async def search_cvs(
    q: str = Query(..., min_length=2, description="Profil ou compétences recherchées"),
    limit: int = Query(20, le=50),
    rh=Depends(require_rh),
    db: AsyncSession = Depends(get_db),
):
    """Recherche sémantique dans la CVthèque — trouve les CVs proches de la requête."""
    import asyncio
    from app.nlp.embedder import encode

    loop = asyncio.get_event_loop()
    query_embedding = await loop.run_in_executor(None, encode, q)
    embedding_str = "[" + ",".join(str(float(v)) for v in query_embedding) + "]"

    results = await db.execute(
        text("""
            SELECT
                cv.id,
                cv.cv_text,
                cv.statut,
                cv.source,
                c.nom,
                c.prenom,
                c.email,
                c.telephone,
                1 - (cv.embedding <=> :emb ::vector) AS score
            FROM cvs cv
            JOIN candidates c ON c.id = cv.id_candidate
            WHERE cv.embedding IS NOT NULL
              AND cv.statut = 'INDEXED'
            ORDER BY cv.embedding <=> :emb ::vector
            LIMIT :limit
        """),
        {"emb": embedding_str, "limit": limit},
    )
    rows = results.fetchall()

    return {
        "query": q,
        "total": len(rows),
        "results": [
            {
                "cv_id":     r.id,
                "nom":       r.nom,
                "prenom":    r.prenom,
                "email":     r.email,
                "telephone": r.telephone,
                "source":    r.source,
                "score":     round(float(r.score), 3),
                "extrait":   (r.cv_text or "")[:300],
            }
            for r in rows
        ],
    }
