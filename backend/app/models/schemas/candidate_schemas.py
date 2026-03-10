from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class CandidateProfileIn(BaseModel):
    nom: str
    prenom: str
    email: EmailStr
    telephone: Optional[str] = None
    adresse: Optional[str] = None
    date_naissance: Optional[str] = None

class CandidateProfileOut(BaseModel):
    id: int
    nom: str
    prenom: str
    email: str
    telephone: Optional[str] = None
    adresse: Optional[str] = None

    class Config:
        from_attributes = True

class CVOut(BaseModel):
    id: int
    id_candidate: int
    date_depot: datetime
    statut: str
    fichier_pdf: Optional[str] = None
    cv_entities: Optional[dict] = None
    score_final: float

    class Config:
        from_attributes = True

class CVListOut(BaseModel):
    total: int
    cvs: List[CVOut]

class ResultatOut(BaseModel):
    id: int
    id_offre: int
    titre_offre: Optional[str] = None
    score_final: float
    score_matching: float
    score_skills: float
    score_experience: float
    decision: str
    date_analyse: datetime

    class Config:
        from_attributes = True

class ResultatListOut(BaseModel):
    total: int
    resultats: List[ResultatOut]