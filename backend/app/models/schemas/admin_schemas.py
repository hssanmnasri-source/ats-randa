from pydantic import BaseModel, EmailStr
from typing import Optional
from app.models.db_models import UserRole

class UserCreateIn(BaseModel):
    nom: str
    prenom: str
    email: EmailStr
    password: str
    role: UserRole
    departement: Optional[str] = None
    id_filiale: Optional[int] = None

class UserUpdateIn(BaseModel):
    nom: Optional[str] = None
    prenom: Optional[str] = None
    email: Optional[EmailStr] = None
    departement: Optional[str] = None
    id_filiale: Optional[int] = None
    role: Optional[UserRole] = None

class UserOut(BaseModel):
    id: int
    nom: str
    prenom: str
    email: str
    role: str
    departement: Optional[str] = None
    id_filiale: Optional[int] = None
    is_active: bool

    class Config:
        from_attributes = True

class UserListOut(BaseModel):
    total: int
    users: list[UserOut]