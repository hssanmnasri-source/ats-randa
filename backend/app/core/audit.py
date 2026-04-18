from sqlalchemy.ext.asyncio import AsyncSession
from app.models.db_models import AuditLog


async def log_action(
    db: AsyncSession,
    action: str,
    user_id: int | None = None,
    resource: str | None = None,
    resource_id: int | None = None,
    details: dict | None = None,
    ip_address: str | None = None,
) -> None:
    entry = AuditLog(
        action=action,
        user_id=user_id,
        resource=resource,
        resource_id=resource_id,
        details=details or {},
        ip_address=ip_address,
    )
    db.add(entry)
    await db.commit()
