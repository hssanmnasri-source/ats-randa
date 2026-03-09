from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.repositories import user_repository
from app.core.security import hash_password
from typing import Optional

async def create_user(db: AsyncSession, data) -> dict:
    existing = await user_repository.get_by_email(db, data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email déjà utilisé"
        )
    user = await user_repository.create(db, {
        "nom":         data.nom,
        "prenom":      data.prenom,
        "email":       data.email,
        "hashed_pwd":  hash_password(data.password),
        "role":        data.role,
        "departement": data.departement,
        "id_filiale":  data.id_filiale,
    })
    return user

async def update_user(db: AsyncSession, user_id: int, data) -> dict:
    user = await user_repository.get_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur introuvable"
        )
    update_data = data.model_dump(exclude_unset=True)
    return await user_repository.update(db, user, update_data)

async def toggle_user(db: AsyncSession, user_id: int) -> dict:
    user = await user_repository.get_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur introuvable"
        )
    return await user_repository.toggle_active(db, user)

async def list_users(
    db: AsyncSession,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    page: int = 1,
    limit: int = 20
) -> dict:
    skip = (page - 1) * limit
    total, users = await user_repository.list_all(
        db, role, is_active, skip, limit
    )
    return {"total": total, "users": users}

async def get_user(db: AsyncSession, user_id: int):
    user = await user_repository.get_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur introuvable"
        )
    return user