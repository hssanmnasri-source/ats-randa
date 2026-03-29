from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from datetime import datetime, timezone
from typing import Optional
from app.core.database import get_db
from app.api.dependencies import require_admin
from app.models.db_models import CV, CVStatus, AuditLog, User

router = APIRouter(prefix="/api/admin", tags=["Admin — System"])


@router.get("/system/health")
async def system_health(
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    import redis as redis_client
    from app.core.config import settings

    # PostgreSQL
    try:
        await db.execute(text("SELECT 1"))
        pg_status = "healthy"
    except Exception as e:
        pg_status = f"error: {str(e)}"

    # pgvector
    try:
        result = await db.execute(text(
            "SELECT extname, extversion FROM pg_extension WHERE extname = 'vector'"
        ))
        row = result.fetchone()
        pgvector_status = f"v{row.extversion}" if row else "not installed"
    except Exception:
        pgvector_status = "error"

    # Redis
    try:
        r = redis_client.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            password=settings.REDIS_PASSWORD if settings.REDIS_PASSWORD else None,
            decode_responses=True,
        )
        r.ping()
        redis_status = "healthy"
        redis_info = r.info("memory")
        redis_memory = redis_info.get("used_memory_human", "?")
    except Exception as e:
        redis_status = f"error: {str(e)}"
        redis_memory = "?"

    # Celery workers
    try:
        from app.core.celery_app import celery_app
        inspect = celery_app.control.inspect(timeout=3)
        active_workers = inspect.active()
        celery_status = "healthy" if active_workers else "no workers"
        worker_count = len(active_workers) if active_workers else 0
    except Exception:
        celery_status = "no workers"
        worker_count = 0

    # DB size
    db_size_row = await db.execute(text(
        "SELECT pg_size_pretty(pg_database_size(current_database()))"
    ))
    db_size_str = db_size_row.scalar()

    # CVs sans embedding
    pending_embeddings = await db.scalar(
        select(func.count(CV.id)).where(
            CV.embedding == None,
            CV.cv_text != None,
            CV.statut != CVStatus.ERROR
        )
    ) or 0

    overall = "healthy" if pg_status == "healthy" and redis_status == "healthy" else "degraded"

    return {
        "status": overall,
        "services": {
            "postgresql": pg_status,
            "pgvector": pgvector_status,
            "redis": redis_status,
            "celery": celery_status,
        },
        "metrics": {
            "db_size": db_size_str,
            "redis_memory": redis_memory,
            "celery_workers": worker_count,
            "cvs_pending_embedding": pending_embeddings,
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/system/reindex")
async def reindex_cvs(admin=Depends(require_admin)):
    from app.tasks.cv_tasks import embed_all_cvs
    task = embed_all_cvs.delay()
    return {
        "message": "Tache de re-indexation lancee",
        "task_id": task.id,
        "status": "PENDING",
    }


@router.get("/audit/logs")
async def get_audit_logs(
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    action: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None),
):
    offset = (page - 1) * limit
    query = select(AuditLog).order_by(AuditLog.created_at.desc())
    count_query = select(func.count(AuditLog.id))

    if action:
        query = query.where(AuditLog.action == action)
        count_query = count_query.where(AuditLog.action == action)
    if user_id:
        query = query.where(AuditLog.user_id == user_id)
        count_query = count_query.where(AuditLog.user_id == user_id)

    total = await db.scalar(count_query) or 0
    result = await db.execute(query.offset(offset).limit(limit))
    logs = result.scalars().all()

    items = []
    for log in logs:
        item = {
            "id": log.id,
            "user_id": log.user_id,
            "action": log.action,
            "resource": log.resource,
            "resource_id": log.resource_id,
            "details": log.details,
            "ip_address": log.ip_address,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        }
        if log.user:
            item["user_nom"] = log.user.nom
            item["user_email"] = log.user.email
        items.append(item)

    return {
        "items": items,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit,
    }


@router.get("/cvs")
async def list_cvs(
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    statut: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
):
    query = select(CV).order_by(CV.created_at.desc())
    count_query = select(func.count(CV.id))

    if statut:
        query = query.where(CV.statut == statut)
        count_query = count_query.where(CV.statut == statut)
    if source:
        query = query.where(CV.source == source)
        count_query = count_query.where(CV.source == source)

    total = await db.scalar(count_query) or 0
    offset = (page - 1) * limit
    result = await db.execute(query.offset(offset).limit(limit))
    cvs = result.scalars().all()

    items = [
        {
            "id": cv.id,
            "nom_fichier": cv.fichier_pdf,
            "source": cv.source.value if hasattr(cv.source, 'value') else cv.source,
            "statut": cv.statut.value if hasattr(cv.statut, 'value') else cv.statut,
            "has_embedding": cv.embedding is not None,
            "id_candidat": cv.id_candidate,
            "created_at": cv.created_at.isoformat() if cv.created_at else None,
        }
        for cv in cvs
    ]

    return {"items": items, "total": total, "page": page}
