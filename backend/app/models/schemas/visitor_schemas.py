from pydantic import BaseModel, EmailStr
from typing import Any, Dict, List, Optional
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
    nb_candidatures: int = 0
    is_new: bool = False
    ville: Optional[str] = None

    class Config:
        from_attributes = True


class PublicOfferDetailOut(PublicOfferOut):
    offres_similaires: List[PublicOfferOut] = []
    mon_score_matching: Optional[float] = None


class PublicOfferListOut(BaseModel):
    total: int
    page: int
    limit: int
    offers: List[PublicOfferOut]