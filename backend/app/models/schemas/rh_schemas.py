from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime


class OfferCreateIn(BaseModel):
    # Core fields (used by NLP scoring)
    titre: str
    description: str
    competences_requises: List[str] = []
    experience_requise: float = 0.0
    langue_requise: str = "fr"
    # Extended fields (stored in details JSONB)
    reference_interne: Optional[str] = None
    type_poste: Optional[Any] = None        # string or list
    disponibilite: Optional[str] = None
    salaire_min: Optional[float] = None
    salaire_max: Optional[float] = None
    salaire_periode: Optional[str] = None
    niveau_etude: Optional[str] = None
    niveau_experience: Optional[str] = None
    langues: Optional[List[str]] = None
    permis: Optional[bool] = None
    metiers: Optional[List[str]] = None
    pays: Optional[str] = None
    region: Optional[str] = None
    ville: Optional[str] = None
    mobilite_locale: Optional[bool] = None
    mobilite_internationale: Optional[bool] = None
    anonyme: Optional[bool] = None
    url_externe: Optional[str] = None
    notification_email: Optional[str] = None
    email_responsable: Optional[str] = None


class OfferUpdateIn(BaseModel):
    titre: Optional[str] = None
    description: Optional[str] = None
    competences_requises: Optional[List[str]] = None
    experience_requise: Optional[float] = None
    langue_requise: Optional[str] = None
    reference_interne: Optional[str] = None
    type_poste: Optional[Any] = None
    disponibilite: Optional[str] = None
    salaire_min: Optional[float] = None
    salaire_max: Optional[float] = None
    salaire_periode: Optional[str] = None
    niveau_etude: Optional[str] = None
    niveau_experience: Optional[str] = None
    langues: Optional[List[str]] = None
    permis: Optional[bool] = None
    metiers: Optional[List[str]] = None
    pays: Optional[str] = None
    region: Optional[str] = None
    ville: Optional[str] = None
    mobilite_locale: Optional[bool] = None
    mobilite_internationale: Optional[bool] = None
    anonyme: Optional[bool] = None
    url_externe: Optional[str] = None
    notification_email: Optional[str] = None
    email_responsable: Optional[str] = None


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
    details: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class OfferListOut(BaseModel):
    total: int
    offers: List[OfferOut]
