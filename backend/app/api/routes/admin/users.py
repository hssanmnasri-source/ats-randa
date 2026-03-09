from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.core.database import get_db
from app.api.dependencies import require_admin
from app.models.schemas.admin_schemas import (
    UserCreateIn, UserUpdateIn, UserOut, UserListOut
)
from app.services.admin import user_service

router = APIRouter(
    prefix="/api/admin",
    tags=["⚙️ Admin — Utilisateurs"],
    dependencies=[Depends(require_admin)]
)

@router.get("/users", response_model=UserListOut)
async def list_users(
    role:      Optional[str]  = Query(None),
    is_active: Optional[bool] = Query(None),
    page:      int            = Query(1, ge=1),
    limit:     int            = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    return await user_service.list_users(db, role, is_active, page, limit)

@router.post("/users", response_model=UserOut, status_code=201)
async def create_user(
    data: UserCreateIn,
    db: AsyncSession = Depends(get_db)
):
    return await user_service.create_user(db, data)

@router.get("/users/{user_id}", response_model=UserOut)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    return await user_service.get_user(db, user_id)

@router.put("/users/{user_id}", response_model=UserOut)
async def update_user(
    user_id: int,
    data: UserUpdateIn,
    db: AsyncSession = Depends(get_db)
):
    return await user_service.update_user(db, user_id, data)

@router.patch("/users/{user_id}/toggle", response_model=UserOut)
async def toggle_user(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    return await user_service.toggle_user(db, user_id)