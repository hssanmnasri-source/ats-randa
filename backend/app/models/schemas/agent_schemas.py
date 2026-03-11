from pydantic import BaseModel, EmailStr
from typing import Optional, List
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

class CVOut(BaseModel):
    id: int
    id_candidate: int
    id_agent: Optional[int] = None
    statut: str
    date_depot: datetime
    cv_text: Optional[str] = None

    class Config:
        from_attributes = True

class CVListOut(BaseModel):
    total: int
    cvs: List[CVOut]