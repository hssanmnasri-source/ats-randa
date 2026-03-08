from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.schemas.visitor_schemas import (
    RegisterIn, LoginIn, TokenOut
)
from app.services.visitor.auth_service import register, login

router = APIRouter(prefix="/api/visitor", tags=["🔐 Auth"])

@router.post("/register", response_model=TokenOut, status_code=201)
async def register_route(
    data: RegisterIn,
    db: AsyncSession = Depends(get_db)
):
    return await register(db, data)

@router.post("/login", response_model=TokenOut)
async def login_route(
    data: LoginIn,
    db: AsyncSession = Depends(get_db)
):
    return await login(db, data)