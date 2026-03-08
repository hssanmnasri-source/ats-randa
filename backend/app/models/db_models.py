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
    VISITOR   = "visitor"
    CANDIDATE = "candidate"
    AGENT     = "agent"
    RH        = "rh"
    ADMIN     = "admin"

class CVStatus(str, enum.Enum):
    UPLOADED  = "uploaded"
    PARSING   = "parsing"
    INDEXED   = "indexed"
    ERROR     = "error"

class OfferStatus(str, enum.Enum):
    ACTIVE    = "active"
    INACTIVE  = "inactive"
    ARCHIVED  = "archived"

class Decision(str, enum.Enum):
    RETAINED  = "retenu"
    PENDING   = "en_attente"
    REFUSED   = "refuse"

class SkillLevel(str, enum.Enum):
    BEGINNER      = "debutant"
    INTERMEDIATE  = "intermediaire"
    EXPERT        = "expert"

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

    cvs = relationship("CV", back_populates="candidate",
                       foreign_keys="CV.id_candidate")

# ── CV ────────────────────────────────────────────
class CV(Base):
    __tablename__ = "cvs"

    id           = Column(Integer, primary_key=True, index=True)
    id_candidate = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    id_agent     = Column(Integer, ForeignKey("users.id"),       nullable=True)
    date_depot   = Column(DateTime(timezone=True), server_default=func.now())
    statut       = Column(SAEnum(CVStatus), default=CVStatus.UPLOADED)
    fichier_pdf  = Column(String(500))
    cv_text      = Column(Text)
    cv_entities  = Column(JSONB, default=dict)
    embedding    = Column(Vector(384))          # ← pgvector
    score_final  = Column(Float, default=0.0)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

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

    id           = Column(Integer, primary_key=True, index=True)
    id_cv        = Column(Integer, ForeignKey("cvs.id"), nullable=False)
    poste        = Column(String(255))
    entreprise   = Column(String(255))
    date_debut   = Column(String(20))
    date_fin     = Column(String(20))
    description  = Column(Text)

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
    decision          = Column(SAEnum(Decision), default=Decision.PENDING)
    date_analyse      = Column(DateTime(timezone=True), server_default=func.now())

    cv    = relationship("CV",       back_populates="resultats")
    offre = relationship("JobOffer", back_populates="resultats")