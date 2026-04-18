from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.schemas.visitor_schemas import (
    RegisterIn, LoginIn, TokenOut
)
from app.services.visitor.auth_service import register, login, get_user_id_by_email
from app.core.audit import log_action

router = APIRouter(prefix="/api/visitor", tags=["🔐 Auth"])

@router.post("/register", response_model=TokenOut, status_code=201)
async def register_route(
    data: RegisterIn,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    result = await register(db, data)
    user_id = await get_user_id_by_email(db, data.email)
    await log_action(db, "USER_CREATED", user_id=user_id, resource="user",
                     details={"email": data.email, "role": "CANDIDATE"},
                     ip_address=request.client.host if request.client else None)
    return result

@router.post("/login", response_model=TokenOut)
async def login_route(
    data: LoginIn,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    result = await login(db, data)
    user_id = await get_user_id_by_email(db, data.email)
    await log_action(db, "USER_LOGIN", user_id=user_id, resource="user",
                     details={"email": data.email, "role": result["role"]},
                     ip_address=request.client.host if request.client else None)
    return result