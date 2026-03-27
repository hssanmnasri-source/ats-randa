from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.core.database import get_db
from app.core.security import decode_token
from app.repositories.user_repository import get_by_id

bearer = HTTPBearer()
_optional_bearer = HTTPBearer(auto_error=False)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: AsyncSession = Depends(get_db)
):
    token = credentials.credentials
    payload = decode_token(token)

    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expiré"
        )

    user = await get_by_id(db, int(payload["sub"]))
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur introuvable"
        )
    return user

def require_role(*roles):
    async def checker(user=Depends(get_current_user)):
        if user.role.value not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Accès refusé — rôle requis : {roles}"
            )
        return user
    return checker

async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_optional_bearer),
    db: AsyncSession = Depends(get_db),
):
    """Returns the authenticated User, or None if no valid token provided."""
    if not credentials:
        return None
    try:
        payload = decode_token(credentials.credentials)
        if not payload or payload.get("type") != "access":
            return None
        user = await get_by_id(db, int(payload["sub"]))
        return user if user and user.is_active else None
    except Exception:
        return None


# ── Shortcuts par acteur ──────────────────────────
require_candidate   = require_role("CANDIDATE")
require_agent       = require_role("AGENT")
require_rh          = require_role("RH")
require_admin       = require_role("ADMIN")
require_rh_or_admin = require_role("RH", "ADMIN")