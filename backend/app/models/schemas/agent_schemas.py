from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime


class CandidateCreateIn(BaseModel):
    nom: str
    prenom: str
    email: Optional[EmailStr] = None
    telephone: Optional[str] = None
    adresse: Optional[str] = None
    date_naissance: Optional[str] = None


class CVCreateIn(BaseModel):
    candidate: CandidateCreateIn
    cv_text: Optional[str] = None
    competences: Optional[List[str]] = []
    experiences: Optional[List[dict]] = []


# ── Candidat ──────────────────────────────────────────────────────────────────

class CandidateOut(BaseModel):
    id: int
    nom: Optional[str] = None
    prenom: Optional[str] = None
    email: Optional[str] = None
    telephone: Optional[str] = None
    adresse: Optional[str] = None
    date_naissance: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CandidateListOut(BaseModel):
    total: int
    page: int
    pages: int
    candidates: List[CandidateOut]


# ── CV ────────────────────────────────────────────────────────────────────────

class CVOut(BaseModel):
    id: int
    id_candidate: int
    id_agent: Optional[int] = None
    statut: str
    source: str
    date_depot: datetime
    fichier_pdf: Optional[str] = None

    class Config:
        from_attributes = True


class CVDetailOut(BaseModel):
    id: int
    id_candidate: int
    id_agent: Optional[int] = None
    statut: str
    source: str
    date_depot: datetime
    fichier_pdf: Optional[str] = None
    cv_entities: Optional[Any] = None
    candidate: Optional[CandidateOut] = None

    class Config:
        from_attributes = True


class CVListOut(BaseModel):
    total: int
    page: int
    pages: int
    cvs: List[CVOut]