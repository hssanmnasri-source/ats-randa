from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class EntretienCreateIn(BaseModel):
    id_resultat: Optional[int] = None
    id_offre: int
    date_entretien: datetime
    duree_minutes: int = 30
    lieu: Optional[str] = None
    type_entretien: str = "presentiel"
    lien_visio: Optional[str] = None
    notes_rh: Optional[str] = None


class EntretienUpdateIn(BaseModel):
    date_entretien: Optional[datetime] = None
    duree_minutes: Optional[int] = None
    lieu: Optional[str] = None
    type_entretien: Optional[str] = None
    lien_visio: Optional[str] = None
    notes_rh: Optional[str] = None
    statut: Optional[str] = None


class EntretienOut(BaseModel):
    id: int
    id_resultat: Optional[int] = None
    id_offre: int
    offre_titre: Optional[str] = None
    date_entretien: datetime
    duree_minutes: int
    lieu: Optional[str] = None
    type_entretien: str
    lien_visio: Optional[str] = None
    notes_rh: Optional[str] = None
    statut: str
    candidat_nom: Optional[str] = None
    candidat_prenom: Optional[str] = None
    candidat_email: Optional[str] = None
    email_candidat_envoye: bool = False

    class Config:
        from_attributes = True


class PlanifierEntretiensIn(BaseModel):
    id_offre: int
    top_n: int = 5
    date_debut: datetime
    duree_minutes: int = 30
    intervalle_minutes: int = 45
    lieu: str = "RANDA — ZI BIR EL KASAA BEN AROUS"
    type_entretien: str = "presentiel"
    envoyer_emails: bool = True


class CreneauxSuggeres(BaseModel):
    candidat_id: int
    candidat_nom: str
    candidat_prenom: str
    candidat_email: str
    score_final: float
    rang: int
    creneau_suggere: datetime
    id_resultat: int


class PlanifierResponse(BaseModel):
    creneaux: List[CreneauxSuggeres]
    message: str
