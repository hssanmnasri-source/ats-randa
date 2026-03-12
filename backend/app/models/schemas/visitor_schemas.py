from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class RegisterIn(BaseModel):
    nom: str
    prenom: str
    email: EmailStr
    password: str

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class TokenOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str

class UserOut(BaseModel):
    id: int
    nom: str
    prenom: str
    email: str
    role: str

    class Config:
        from_attributes = True

# ── Offres publiques ───────────────────────────────
class PublicOfferOut(BaseModel):
    id: int
    titre: str
    description: str
    competences_requises: List[str]
    experience_requise: float
    langue_requise: str
    date_publication: datetime
    plateforme_source: str

    class Config:
        from_attributes = True

class PublicOfferListOut(BaseModel):
    total: int
    page: int
    limit: int
    offers: List[PublicOfferOut]