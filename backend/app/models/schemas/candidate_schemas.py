from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import datetime


# ── Profil candidat ───────────────────────────────────────────────────────────

class CandidateProfileIn(BaseModel):
    nom: str
    prenom: str
    email: EmailStr
    telephone: Optional[str] = None
    adresse: Optional[str] = None
    date_naissance: Optional[str] = None


class CandidateProfileOut(BaseModel):
    id: int
    nom: Optional[str] = None
    prenom: Optional[str] = None
    email: Optional[str] = None
    telephone: Optional[str] = None
    adresse: Optional[str] = None
    date_naissance: Optional[str] = None
    # Extended fields
    photo_url:           Optional[str]  = None
    titre_poste:         Optional[str]  = None
    niveau_etude:        Optional[str]  = None
    salaire_actuel:      Optional[str]  = None
    disponibilite:       Optional[str]  = None
    genre:               Optional[str]  = None
    situation_familiale: Optional[str]  = None
    nationalite:         Optional[str]  = None
    has_driving_license: bool = False
    owns_car:            bool = False
    has_handicap:        bool = False
    visibility_status:   str  = "VISIBLE"
    alert_frequency:     str  = "WEEKLY"
    created_at: datetime

    class Config:
        from_attributes = True


class CandidateProfileUpdateIn(BaseModel):
    nom:                 Optional[str]  = None
    prenom:              Optional[str]  = None
    telephone:           Optional[str]  = None
    adresse:             Optional[str]  = None
    date_naissance:      Optional[str]  = None
    titre_poste:         Optional[str]  = None
    niveau_etude:        Optional[str]  = None
    salaire_actuel:      Optional[str]  = None
    disponibilite:       Optional[str]  = None
    genre:               Optional[str]  = None
    situation_familiale: Optional[str]  = None
    nationalite:         Optional[str]  = None
    has_driving_license: Optional[bool] = None
    owns_car:            Optional[bool] = None
    has_handicap:        Optional[bool] = None


class VisibilityUpdateIn(BaseModel):
    visibility_status: str   # VISIBLE | ANONYMOUS | INVISIBLE
    alert_frequency:   Optional[str] = None   # DAILY | TWICE_WEEK | WEEKLY | NEVER


# ── Expériences (CRUD direct depuis profil) ───────────────────────────────────

class ExperienceIn(BaseModel):
    poste:       str
    entreprise:  str
    date_debut:  Optional[str] = None
    date_fin:    Optional[str] = None
    description: Optional[str] = None


class ExperienceOut(BaseModel):
    id:          int
    poste:       Optional[str] = None
    entreprise:  Optional[str] = None
    date_debut:  Optional[str] = None
    date_fin:    Optional[str] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True


# ── Compétences (CRUD direct depuis profil) ───────────────────────────────────

class SkillIn(BaseModel):
    nom_competence: str
    niveau:         str = "INTERMEDIATE"  # BEGINNER | INTERMEDIATE | EXPERT


class SkillOut(BaseModel):
    id:             int
    nom_competence: str
    niveau:         str

    class Config:
        from_attributes = True


# ── Complétion du profil ──────────────────────────────────────────────────────

class SectionCompletion(BaseModel):
    weight: int
    score:  int
    filled: bool


class ProfileCompletionOut(BaseModel):
    total:    int   # 0-100
    sections: dict  # key → SectionCompletion dict


# ── Profil complet (une seule requête) ────────────────────────────────────────

class FullProfileOut(BaseModel):
    profile:     CandidateProfileOut
    completion:  ProfileCompletionOut
    experiences: List[ExperienceOut]
    skills:      List[SkillOut]
    langues:     List[dict]   # from cv_entities


# ── CV ────────────────────────────────────────────────────────────────────────

class CVOut(BaseModel):
    id:           int
    id_candidate: int
    date_depot:   datetime
    statut:       str
    source:       Optional[str] = None
    fichier_pdf:  Optional[str] = None
    cv_entities:  Optional[dict] = None
    score_final:  float

    class Config:
        from_attributes = True


class CVListOut(BaseModel):
    total: int
    cvs:   List[CVOut]


# ── Formulaire CV en ligne ────────────────────────────────────────────────────

NIVEAUX_ETUDE_VALIDES = {"BAC", "BAC+2", "BAC+3", "BAC+5", "Doctorat"}


class LangueIn(BaseModel):
    langue: str
    niveau: Optional[str] = "intermédiaire"


class CVFormIn(BaseModel):
    titre_poste:       str
    resume:            str
    experience_annees: float
    niveau_etude:      str
    competences:       List[str]
    langues:           Optional[List[LangueIn]] = []
    telephone:         Optional[str] = None
    adresse:           Optional[str] = None
    disponibilite:     Optional[str] = None
    salaire_souhaite:  Optional[str] = None

    @field_validator("resume")
    @classmethod
    def resume_min_length(cls, v: str) -> str:
        if len(v.strip()) < 50:
            raise ValueError("Le résumé doit contenir au moins 50 caractères")
        return v.strip()

    @field_validator("experience_annees")
    @classmethod
    def experience_range(cls, v: float) -> float:
        if not (0 <= v <= 50):
            raise ValueError("L'expérience doit être entre 0 et 50 ans")
        return v

    @field_validator("niveau_etude")
    @classmethod
    def niveau_valide(cls, v: str) -> str:
        if v not in NIVEAUX_ETUDE_VALIDES:
            raise ValueError(
                f"Niveau d'étude invalide. Valeurs acceptées : {sorted(NIVEAUX_ETUDE_VALIDES)}"
            )
        return v

    @field_validator("competences")
    @classmethod
    def competences_min(cls, v: List[str]) -> List[str]:
        cleaned = [c.strip() for c in v if c.strip()]
        if not cleaned:
            raise ValueError("Au moins une compétence est requise")
        return cleaned


# ── Candidature ───────────────────────────────────────────────────────────────

class OffreResume(BaseModel):
    id:               int
    titre:            str
    description:      Optional[str] = None
    date_publication: Optional[datetime] = None
    statut:           Optional[str] = None

    class Config:
        from_attributes = True


class ApplicationOut(BaseModel):
    id:           int
    id_offre:     int
    id_cv:        int
    score_final:  float
    decision:     str
    date_analyse: datetime
    offre:        Optional[OffreResume] = None

    class Config:
        from_attributes = True


class ApplicationListOut(BaseModel):
    total:        int
    candidatures: List[ApplicationOut]


# ── Résultats (vue candidat) ──────────────────────────────────────────────────

class ResultatOut(BaseModel):
    id:               int
    id_offre:         int
    titre_offre:      Optional[str] = None
    score_final:      float
    score_matching:   float
    score_skills:     float
    score_experience: float
    decision:         str
    date_analyse:     datetime

    class Config:
        from_attributes = True


class ResultatListOut(BaseModel):
    total:    int
    resultats: List[ResultatOut]


# ── Lettres de motivation ─────────────────────────────────────────────────────

class CoverLetterIn(BaseModel):
    titre:   str = Field(..., min_length=1, max_length=255)
    contenu: str = Field(..., min_length=1, max_length=5000)


class CoverLetterOut(BaseModel):
    id:         int
    titre:      str
    contenu:    str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CoverLetterListOut(BaseModel):
    total:         int
    cover_letters: List[CoverLetterOut]


# ── Documents ─────────────────────────────────────────────────────────────────

class DocumentOut(BaseModel):
    id:         int
    nom:        str
    type_doc:   Optional[str] = None
    taille:     Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentListOut(BaseModel):
    total:     int
    documents: List[DocumentOut]
