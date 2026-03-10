from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class OfferCreateIn(BaseModel):
    titre: str
    description: str
    competences_requises: List[str] = []
    experience_requise: float = 0.0
    langue_requise: str = "fr"

class OfferUpdateIn(BaseModel):
    titre: Optional[str] = None
    description: Optional[str] = None
    competences_requises: Optional[List[str]] = None
    experience_requise: Optional[float] = None
    langue_requise: Optional[str] = None

class OfferOut(BaseModel):
    id: int
    titre: str
    description: str
    competences_requises: List[str]
    experience_requise: float
    langue_requise: str
    date_publication: datetime
    plateforme_source: str
    statut: str
    id_rh: Optional[int] = None

    class Config:
        from_attributes = True

class OfferListOut(BaseModel):
    total: int
    offers: List[OfferOut]