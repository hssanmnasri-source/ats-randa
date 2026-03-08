from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.repositories.user_repository import get_by_email, create
from app.models.db_models import UserRole
from app.core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token
)

async def register(db: AsyncSession, data) -> dict:
    # Vérifier si l'email existe déjà
    existing = await get_by_email(db, data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email déjà utilisé"
        )

    user = await create(db, {
        "nom":        data.nom,
        "prenom":     data.prenom,
        "email":      data.email,
        "hashed_pwd": hash_password(data.password),
        "role":       UserRole.CANDIDATE,
    })

    return _build_tokens(user)

async def login(db: AsyncSession, data) -> dict:
    user = await get_by_email(db, data.email)

    if not user or not verify_password(data.password, user.hashed_pwd):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Compte désactivé"
        )

    return _build_tokens(user)

def _build_tokens(user) -> dict:
    payload = {"sub": str(user.id), "role": user.role.value}
    return {
        "access_token":  create_access_token(payload),
        "refresh_token": create_refresh_token(payload),
        "token_type":    "bearer",
        "role":          user.role.value,
    }