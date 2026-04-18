from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.core.database import get_db
from app.api.dependencies import require_admin
from app.models.schemas.admin_schemas import (
    UserCreateIn, UserUpdateIn, UserOut, UserListOut
)
from app.services.admin import user_service
from app.core.audit import log_action

router = APIRouter(
    prefix="/api/admin",
    tags=["⚙️ Admin — Utilisateurs"],
)

@router.get("/users", response_model=UserListOut, dependencies=[Depends(require_admin)])
async def list_users(
    role:      Optional[str]  = Query(None),
    is_active: Optional[bool] = Query(None),
    search:    Optional[str]  = Query(None),
    page:      int            = Query(1, ge=1),
    limit:     int            = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    return await user_service.list_users(db, role, is_active, page, limit, search=search)

@router.post("/users", response_model=UserOut, status_code=201)
async def create_user(
    data: UserCreateIn,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    user = await user_service.create_user(db, data)
    await log_action(db, "USER_CREATED", user_id=admin.id, resource="user",
                     resource_id=user.id, details={"email": data.email, "role": data.role.value})
    return user

@router.get("/users/{user_id}", response_model=UserOut, dependencies=[Depends(require_admin)])
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    return await user_service.get_user(db, user_id)

@router.put("/users/{user_id}", response_model=UserOut)
async def update_user(
    user_id: int,
    data: UserUpdateIn,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    user = await user_service.update_user(db, user_id, data)
    await log_action(db, "USER_UPDATED", user_id=admin.id, resource="user", resource_id=user_id)
    return user

@router.patch("/users/{user_id}/toggle", response_model=UserOut)
async def toggle_user(
    user_id: int,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    user = await user_service.toggle_user(db, user_id)
    await log_action(db, "USER_TOGGLED", user_id=admin.id, resource="user", resource_id=user_id,
                     details={"is_active": user.is_active})
    return user