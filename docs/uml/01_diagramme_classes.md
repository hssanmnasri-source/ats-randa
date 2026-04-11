# Diagramme de Classes — Modèle de Données ATS RANDA

## Description

Ce diagramme représente le modèle de données complet de l'ATS RANDA, tel que défini dans `backend/app/models/db_models.py`. Il montre toutes les entités persistantes, leurs attributs avec types exacts (y compris les colonnes pgvector et JSONB), ainsi que toutes les relations de clés étrangères avec leurs cardinalités.

La classe centrale est **CV** : elle reçoit les embeddings vectoriels 384-dim, est liée aux compétences et expériences extraites par le pipeline NLP, et participe au matching via la table **Resultat**. La classe **Resultat** est la jonction pivot entre un CV et une offre d'emploi — elle contient les 4 sous-scores calculés par `scorer.py` ainsi que la décision RH.

## Diagramme

```mermaid
classDiagram
    class Filiale {
        +Integer id PK
        +String(255) nom_filiale
        +Text adresse
        +String(100) ville
        +DateTime created_at
    }

    class User {
        +Integer id PK
        +String(255) nom
        +String(255) prenom
        +String(255) email UNIQUE INDEX
        +String(255) hashed_pwd
        +UserRole role
        +String(100) departement
        +Integer id_filiale FK
        +Boolean is_active
        +DateTime created_at
        +DateTime updated_at
        +String(255) google_id UNIQUE
        +Text avatar_url
        +String(20) auth_provider
    }

    class Candidate {
        +Integer id PK
        +String(255) nom
        +String(255) prenom
        +String(255) email UNIQUE INDEX
        +String(20) telephone
        +Text adresse
        +String(20) date_naissance
        +Integer age
        +String(50) niveau_experience
        +String(500) photo_url
        +String(255) titre_poste
        +String(50) niveau_etude
        +String(100) salaire_actuel
        +String(100) disponibilite
        +String(20) genre
        +String(50) situation_familiale
        +String(100) nationalite
        +Boolean has_driving_license
        +Boolean owns_car
        +Boolean has_handicap
        +VisibilityStatus visibility_status
        +AlertFrequency alert_frequency
        +String(10) code_postal
        +String(100) ville
        +String(100) region
        +Boolean mobilite_tn
        +Boolean mobilite_intl
        +String(50) statut_pro
        +JSONB secteurs_recherche
        +JSONB metiers_recherche
        +DateTime created_at
    }

    class CV {
        +Integer id PK
        +Integer id_candidate FK
        +Integer id_agent FK nullable
        +DateTime date_depot
        +CVStatus statut
        +CVSource source
        +String(500) fichier_pdf
        +Text cv_text
        +JSONB cv_entities
        +Vector(384) embedding
        +Float score_final
        +Integer cv_version
        +DateTime created_at
        +DateTime updated_at
    }

    class Competence {
        +Integer id PK
        +Integer id_cv FK
        +String(255) nom_competence
        +SkillLevel niveau
    }

    class Experience {
        +Integer id PK
        +Integer id_cv FK
        +String(255) poste
        +String(255) entreprise
        +String(20) date_debut
        +String(20) date_fin
        +Text description
        +String(50) type_contrat
        +String(50) taille_entreprise
        +String(100) categorie_entreprise
        +String(255) secteur_activite
        +Text missions
        +Boolean is_current
    }

    class JobOffer {
        +Integer id PK
        +Integer id_rh FK nullable
        +String(255) titre
        +Text description
        +JSONB competences_requises
        +Float experience_requise
        +String(10) langue_requise
        +DateTime date_publication
        +String(100) plateforme_source
        +Vector(384) embedding
        +OfferStatus statut
        +DateTime last_matching_at
        +JSONB details
        +Integer seuil_alerte
        +Boolean alerte_envoyee
        +Boolean matching_auto
        +Float poids_semantique
        +Float poids_competences
        +Float poids_experience
        +Float poids_langue
        +DateTime date_expiration
        +Text raison_refus
        +DateTime created_at
    }

    class Resultat {
        +Integer id PK
        +Integer id_cv FK
        +Integer id_offre FK
        +Float score_matching
        +Float score_skills
        +Float score_experience
        +Float score_langue
        +Float score_final
        +Integer rang
        +Decision decision
        +DateTime date_analyse
        +DateTime last_score_updated_at
        +Text feedback_rh nullable
        +Boolean feedback_visible
        +DateTime date_decision nullable
    }

    class CoverLetter {
        +Integer id PK
        +Integer id_candidate FK
        +String(255) titre
        +Text contenu
        +DateTime created_at
        +DateTime updated_at
    }

    class CandidateDocument {
        +Integer id PK
        +Integer id_candidate FK
        +String(255) nom
        +String(500) fichier
        +String(50) type_doc
        +Integer taille
        +DateTime created_at
    }

    class Entretien {
        +Integer id PK
        +Integer id_resultat FK nullable
        +Integer id_offre FK
        +Integer id_rh FK nullable
        +Integer id_candidate_user FK nullable
        +DateTime date_entretien
        +Integer duree_minutes
        +String(255) lieu
        +String(50) type_entretien
        +Text lien_visio
        +Text notes_rh
        +String(20) statut
        +Boolean email_envoye
        +String(255) n8n_execution_id
        +DateTime created_at
        +DateTime updated_at
    }

    class AuditLog {
        +Integer id PK
        +Integer user_id FK nullable
        +String(100) action INDEX
        +String(100) resource
        +Integer resource_id
        +JSONB details
        +String(50) ip_address
        +DateTime created_at INDEX
    }

    %% Énumérations
    class UserRole {
        <<enumeration>>
        VISITOR
        CANDIDATE
        AGENT
        RH
        ADMIN
    }

    class CVStatus {
        <<enumeration>>
        UPLOADED
        PARSING
        INDEXED
        ERROR
    }

    class CVSource {
        <<enumeration>>
        KEEJOB
        AGENT
        CANDIDAT
        EMAIL
        LINKEDIN
    }

    class OfferStatus {
        <<enumeration>>
        ACTIVE
        INACTIVE
        ARCHIVED
        BROUILLON
        EN_VALIDATION
        PROCHAINEMENT
        DESACTIVEE
        EXPIREE
        REFUSEE
    }

    class Decision {
        <<enumeration>>
        RETAINED
        PENDING
        REFUSED
    }

    class SkillLevel {
        <<enumeration>>
        BEGINNER
        INTERMEDIATE
        EXPERT
    }

    %% Relations
    Filiale "1" --> "0..*" User : id_filiale
    User "1" --> "0..*" CV : id_agent (CVs importés)
    User "1" --> "0..*" AuditLog : user_id
    Candidate "1" --> "0..*" CV : id_candidate
    Candidate "1" --> "0..*" CoverLetter : id_candidate
    Candidate "1" --> "0..*" CandidateDocument : id_candidate
    CV "1" --> "0..*" Competence : id_cv
    CV "1" --> "0..*" Experience : id_cv
    CV "1" --> "0..*" Resultat : id_cv
    JobOffer "1" --> "0..*" Resultat : id_offre
    JobOffer "1" --> "0..*" Entretien : id_offre
    Resultat "1" --> "0..1" Entretien : id_resultat
    User "1" --> "0..*" Entretien : id_rh
    User "1" --> "0..*" Entretien : id_candidate_user
    User "1" --> "0..*" JobOffer : id_rh

    %% Dépendances type
    CV --> CVStatus
    CV --> CVSource
    User --> UserRole
    JobOffer --> OfferStatus
    Resultat --> Decision
    Competence --> SkillLevel
```

## Explication des relations

| Classe A | Relation | Classe B | Cardinalité | Signification |
|----------|----------|----------|-------------|---------------|
| `Filiale` | possède | `User` | 1 → 0..* | Une filiale regroupe plusieurs utilisateurs |
| `User` | importe | `CV` | 1 → 0..* | Un agent a importé ces CVs (FK `id_agent`) |
| `User` | crée | `JobOffer` | 1 → 0..* | Un RH est auteur des offres (`id_rh`) |
| `User` | génère | `AuditLog` | 1 → 0..* | Chaque action utilisateur est tracée |
| `User` | anime | `Entretien` | 1 → 0..* | Un RH conduit les entretiens (`id_rh`) |
| `User` | est convoqué | `Entretien` | 1 → 0..* | Un candidat-user reçoit une invitation |
| `Candidate` | dépose | `CV` | 1 → 0..* | Un candidat peut avoir plusieurs CVs |
| `Candidate` | rédige | `CoverLetter` | 1 → 0..* | Cascade delete à la suppression du candidat |
| `Candidate` | joint | `CandidateDocument` | 1 → 0..* | Cascade delete à la suppression du candidat |
| `CV` | a | `Competence` | 1 → 0..* | Cascade delete — compétences extraites par NLP |
| `CV` | a | `Experience` | 1 → 0..* | Cascade delete — expériences extraites par NLP |
| `CV` | participe à | `Resultat` | 1 → 0..* | Cascade delete — résultats de matching |
| `JobOffer` | génère | `Resultat` | 1 → 0..* | Cascade delete — résultats de matching |
| `JobOffer` | planifie | `Entretien` | 1 → 0..* | Une offre peut avoir plusieurs entretiens |
| `Resultat` | déclenche | `Entretien` | 1 → 0..1 | Un résultat RETAINED peut mener à un entretien |

## Notes techniques

### Colonnes pgvector
- `CV.embedding` : `Vector(384)` — vecteur 384-dim normalisé produit par `paraphrase-multilingual-MiniLM-L12-v2`
- `JobOffer.embedding` : `Vector(384)` — vecteur de l'offre construit depuis titre + description + compétences

Un index `ivfflat` (100 listes, distance cosinus) est créé sur `cvs.embedding` pour accélérer les requêtes de recherche des plus proches voisins lors du matching.

### Colonnes JSONB
- `CV.cv_entities` : objet JSON libre stockant les 15+ entités parsées (compétences, expériences, formations, langues, etc.)
- `JobOffer.competences_requises` : liste JSON des compétences requises (utilisée par `scorer.py` pour le calcul Jaccard)
- `JobOffer.details` : champs étendus libres (lieu, type de contrat, salaire, etc.)
- `Candidate.secteurs_recherche` / `metiers_recherche` : listes JSON de préférences

### Absence de table Candidature séparée
Il n'existe **pas** de table `candidatures` distincte dans le schéma. Quand un candidat postule via `POST /api/candidate/offers/{id}/apply`, un enregistrement **Resultat** est créé avec `decision=PENDING`. La "candidature" est donc représentée par ce Resultat initial.
