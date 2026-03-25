from sqlalchemy import (
    Column, Integer, String, Float,
    DateTime, Boolean, Text, ForeignKey,
    Enum as SAEnum
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
from app.core.database import Base
import enum

# ── Enums ─────────────────────────────────────────
class UserRole(str, enum.Enum):
    VISITOR   = "VISITOR"
    CANDIDATE = "CANDIDATE"
    AGENT     = "AGENT"
    RH        = "RH"
    ADMIN     = "ADMIN"

class CVStatus(str, enum.Enum):
    UPLOADED  = "UPLOADED"
    PARSING   = "PARSING"
    INDEXED   = "INDEXED"
    ERROR     = "ERROR"

class OfferStatus(str, enum.Enum):
    ACTIVE    = "ACTIVE"
    INACTIVE  = "INACTIVE"
    ARCHIVED  = "ARCHIVED"

class Decision(str, enum.Enum):
    RETAINED  = "RETAINED"
    PENDING   = "PENDING"
    REFUSED   = "REFUSED"

class SkillLevel(str, enum.Enum):
    BEGINNER      = "BEGINNER"
    INTERMEDIATE  = "INTERMEDIATE"
    EXPERT        = "EXPERT"

class CVSource(str, enum.Enum):
    KEEJOB    = "KEEJOB"
    AGENT     = "AGENT"
    CANDIDAT  = "CANDIDAT"
    EMAIL     = "EMAIL"
    LINKEDIN  = "LINKEDIN"

class VisibilityStatus(str, enum.Enum):
    VISIBLE   = "VISIBLE"    # Profil visible par les recruteurs
    ANONYMOUS = "ANONYMOUS"  # Visible mais nom/contact masqués
    INVISIBLE = "INVISIBLE"  # Non visible

class AlertFrequency(str, enum.Enum):
    DAILY      = "DAILY"
    TWICE_WEEK = "TWICE_WEEK"
    WEEKLY     = "WEEKLY"
    NEVER      = "NEVER"

# ── Filiale ───────────────────────────────────────
class Filiale(Base):
    __tablename__ = "filiates"

    id           = Column(Integer, primary_key=True, index=True)
    nom_filiale  = Column(String(255), nullable=False)
    adresse      = Column(Text)
    ville        = Column(String(100))
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    users = relationship("User", back_populates="filiale")

# ── User ──────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id           = Column(Integer, primary_key=True, index=True)
    nom          = Column(String(255), nullable=False)
    prenom       = Column(String(255), nullable=False)
    email        = Column(String(255), unique=True, nullable=False, index=True)
    hashed_pwd   = Column(String(255), nullable=False)
    role         = Column(SAEnum(UserRole), default=UserRole.CANDIDATE)
    departement  = Column(String(100))
    id_filiale   = Column(Integer, ForeignKey("filiates.id"), nullable=True)
    is_active    = Column(Boolean, default=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    updated_at   = Column(DateTime(timezone=True), onupdate=func.now())

    filiale      = relationship("Filiale", back_populates="users")
    cvs_registered = relationship("CV", back_populates="agent",
                                  foreign_keys="CV.id_agent")

# ── Candidate ─────────────────────────────────────
class Candidate(Base):
    __tablename__ = "candidates"

    id              = Column(Integer, primary_key=True, index=True)
    nom             = Column(String(255))
    prenom          = Column(String(255))
    email           = Column(String(255), unique=True, index=True)
    telephone       = Column(String(20))
    adresse         = Column(Text)
    date_naissance  = Column(String(20))
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    # ── Extended profile fields ────────────────────
    photo_url           = Column(String(500))
    titre_poste         = Column(String(255))
    niveau_etude        = Column(String(50))
    salaire_actuel      = Column(String(100))
    disponibilite       = Column(String(100))
    genre               = Column(String(20))
    situation_familiale = Column(String(50))
    nationalite         = Column(String(100))
    has_driving_license = Column(Boolean, default=False)
    owns_car            = Column(Boolean, default=False)
    has_handicap        = Column(Boolean, default=False)
    visibility_status   = Column(SAEnum(VisibilityStatus), default=VisibilityStatus.VISIBLE)
    alert_frequency     = Column(SAEnum(AlertFrequency),   default=AlertFrequency.WEEKLY)
    # ── Location & Mobility ──────────────────────────
    code_postal         = Column(String(10))
    ville               = Column(String(100))
    region              = Column(String(100))
    mobilite_tn         = Column(Boolean, default=False)
    mobilite_intl       = Column(Boolean, default=False)
    # ── Professional preferences ──────────────────────
    statut_pro          = Column(String(50))          # EN_POSTE | EN_RECHERCHE | ETUDIANT
    secteurs_recherche  = Column(JSONB, default=list) # list of sector names
    metiers_recherche   = Column(JSONB, default=list) # list of job title strings

    cvs = relationship("CV", back_populates="candidate",
                       foreign_keys="CV.id_candidate")
    cover_letters = relationship("CoverLetter", back_populates="candidate",
                                 cascade="all, delete-orphan")
    documents     = relationship("CandidateDocument", back_populates="candidate",
                                 cascade="all, delete-orphan")

# ── CV ────────────────────────────────────────────
class CV(Base):
    __tablename__ = "cvs"

    id           = Column(Integer, primary_key=True, index=True)
    id_candidate = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    id_agent     = Column(Integer, ForeignKey("users.id"),       nullable=True)
    date_depot   = Column(DateTime(timezone=True), server_default=func.now())
    statut       = Column(SAEnum(CVStatus), default=CVStatus.UPLOADED)
    source       = Column(SAEnum(CVSource), default=CVSource.AGENT, nullable=False)
    fichier_pdf  = Column(String(500))
    cv_text      = Column(Text)
    cv_entities  = Column(JSONB, default=dict)
    embedding    = Column(Vector(384))          # ← pgvector
    score_final  = Column(Float, default=0.0)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    updated_at   = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    cv_version   = Column(Integer, default=1)

    candidate    = relationship("Candidate", back_populates="cvs",
                                foreign_keys=[id_candidate])
    agent        = relationship("User", back_populates="cvs_registered",
                                foreign_keys=[id_agent])
    competences  = relationship("Competence",  back_populates="cv",
                                cascade="all, delete-orphan")
    experiences  = relationship("Experience",  back_populates="cv",
                                cascade="all, delete-orphan")
    resultats    = relationship("Resultat",    back_populates="cv",
                                cascade="all, delete-orphan")

# ── Competence ────────────────────────────────────
class Competence(Base):
    __tablename__ = "competences"

    id              = Column(Integer, primary_key=True, index=True)
    id_cv           = Column(Integer, ForeignKey("cvs.id"), nullable=False)
    nom_competence  = Column(String(255), nullable=False)
    niveau          = Column(SAEnum(SkillLevel), default=SkillLevel.INTERMEDIATE)

    cv = relationship("CV", back_populates="competences")

# ── Experience ────────────────────────────────────
class Experience(Base):
    __tablename__ = "experiences"

    id                  = Column(Integer, primary_key=True, index=True)
    id_cv               = Column(Integer, ForeignKey("cvs.id"), nullable=False)
    poste               = Column(String(255))
    entreprise          = Column(String(255))
    date_debut          = Column(String(20))
    date_fin            = Column(String(20))
    description         = Column(Text)
    # ── Extended Keejob-style fields ─────────────────
    type_contrat        = Column(String(50))   # CDI | CDD | SIVP | Freelance | Stage | Alternance
    taille_entreprise   = Column(String(50))   # <20 | 20-100 | 100-500 | >500
    categorie_entreprise= Column(String(100))  # Privée TN | Étrangère | Publique
    secteur_activite    = Column(String(255))
    missions            = Column(Text)         # detailed bullet points
    is_current          = Column(Boolean, default=False)

    cv = relationship("CV", back_populates="experiences")

# ── JobOffer ──────────────────────────────────────
class JobOffer(Base):
    __tablename__ = "job_offers"

    id                   = Column(Integer, primary_key=True, index=True)
    id_rh                = Column(Integer, ForeignKey("users.id"), nullable=True)
    titre                = Column(String(255), nullable=False)
    description          = Column(Text)
    competences_requises = Column(JSONB, default=list)
    experience_requise   = Column(Float, default=0.0)
    langue_requise       = Column(String(10), default="fr")
    date_publication     = Column(DateTime(timezone=True), server_default=func.now())
    plateforme_source    = Column(String(100), default="randa")
    embedding            = Column(Vector(384))   # ← pgvector
    statut               = Column(SAEnum(OfferStatus), default=OfferStatus.ACTIVE)
    last_matching_at     = Column(DateTime(timezone=True), nullable=True)
    details              = Column(JSONB, nullable=True)  # extended fields

    resultats = relationship("Resultat", back_populates="offre",
                             cascade="all, delete-orphan")

# ── Resultat ──────────────────────────────────────
class Resultat(Base):
    __tablename__ = "resultats"

    id                = Column(Integer, primary_key=True, index=True)
    id_cv             = Column(Integer, ForeignKey("cvs.id"),        nullable=False)
    id_offre          = Column(Integer, ForeignKey("job_offers.id"), nullable=False)
    score_matching    = Column(Float, default=0.0)
    score_skills      = Column(Float, default=0.0)
    score_experience  = Column(Float, default=0.0)
    score_langue      = Column(Float, default=0.0)
    score_final       = Column(Float, default=0.0)
    rang              = Column(Integer)
    decision               = Column(SAEnum(Decision), default=Decision.PENDING)
    date_analyse           = Column(DateTime(timezone=True), server_default=func.now())
    last_score_updated_at  = Column(DateTime(timezone=True), server_default=func.now())

    cv    = relationship("CV",       back_populates="resultats")
    offre = relationship("JobOffer", back_populates="resultats")

# ── CoverLetter ────────────────────────────────────
class CoverLetter(Base):
    __tablename__ = "cover_letters"

    id           = Column(Integer, primary_key=True, index=True)
    id_candidate = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    titre        = Column(String(255), nullable=False)
    contenu      = Column(Text, nullable=False)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    updated_at   = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    candidate = relationship("Candidate", back_populates="cover_letters")

# ── CandidateDocument ──────────────────────────────
class CandidateDocument(Base):
    __tablename__ = "candidate_documents"

    id           = Column(Integer, primary_key=True, index=True)
    id_candidate = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    nom          = Column(String(255), nullable=False)
    fichier      = Column(String(500), nullable=False)
    type_doc     = Column(String(50), default="Autre")  # CV | Diplome | CIN | Autre
    taille       = Column(Integer)                       # bytes
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    candidate = relationship("Candidate", back_populates="documents")