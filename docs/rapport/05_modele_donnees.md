# Modèle de Données

## 6.1 Tables principales

### Table `users`

Stocke tous les comptes utilisateurs du système, tous rôles confondus.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | `INTEGER` | PK, auto-increment | Identifiant unique |
| `nom` | `VARCHAR(255)` | NOT NULL | Nom de famille |
| `prenom` | `VARCHAR(255)` | NOT NULL | Prénom |
| `email` | `VARCHAR(255)` | UNIQUE, NOT NULL, INDEX | Adresse email (identifiant de connexion) |
| `hashed_pwd` | `VARCHAR(255)` | NOT NULL | Mot de passe haché bcrypt |
| `role` | `ENUM` | DEFAULT `CANDIDATE` | Rôle RBAC : `VISITOR`, `CANDIDATE`, `AGENT`, `RH`, `ADMIN` |
| `departement` | `VARCHAR(100)` | NULL | Département de l'utilisateur |
| `id_filiale` | `INTEGER` | FK → `filiates.id`, NULL | Filiale associée |
| `is_active` | `BOOLEAN` | DEFAULT `true` | Compte actif/désactivé |
| `created_at` | `DATETIME` | DEFAULT NOW() | Date de création |
| `updated_at` | `DATETIME` | ON UPDATE NOW() | Dernière modification |
| `google_id` | `VARCHAR(255)` | UNIQUE, NULL | Identifiant Google OAuth2 |
| `avatar_url` | `TEXT` | NULL | URL de l'avatar Google |
| `auth_provider` | `VARCHAR(20)` | DEFAULT `'local'` | `'local'` ou `'google'` |

**Relations** : `id_filiale` → `filiates.id` (N:1)

---

### Table `filiates`

Entités juridiques ou succursales de l'entreprise.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | `INTEGER` | PK | Identifiant |
| `nom_filiale` | `VARCHAR(255)` | NOT NULL | Nom de la filiale |
| `adresse` | `TEXT` | NULL | Adresse |
| `ville` | `VARCHAR(100)` | NULL | Ville |
| `created_at` | `DATETIME` | DEFAULT NOW() | Date de création |

---

### Table `candidates`

Profil étendu du candidat. Un compte `User` avec rôle `CANDIDATE` est systématiquement lié à un enregistrement `Candidate`.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | `INTEGER PK` | Identifiant |
| `nom`, `prenom` | `VARCHAR(255)` | Identité |
| `email` | `VARCHAR(255) UNIQUE INDEX` | Email (doit correspondre à `users.email`) |
| `telephone` | `VARCHAR(20)` | Téléphone |
| `adresse` | `TEXT` | Adresse postale |
| `date_naissance` | `VARCHAR(20)` | Date de naissance (format libre) |
| `age` | `INTEGER` | Âge calculé |
| `titre_poste` | `VARCHAR(255)` | Intitulé du poste souhaité |
| `niveau_experience` | `VARCHAR(50)` | JUNIOR, SENIOR, etc. |
| `niveau_etude` | `VARCHAR(50)` | BAC, BAC+2, BAC+3, BAC+5, Doctorat |
| `statut_pro` | `VARCHAR(50)` | EN_POSTE, EN_RECHERCHE, ETUDIANT |
| `secteurs_recherche` | `JSONB` | Liste des secteurs recherchés |
| `metiers_recherche` | `JSONB` | Liste des métiers recherchés |
| `salaire_actuel` | `VARCHAR(100)` | Prétentions salariales |
| `disponibilite` | `VARCHAR(100)` | Délai de disponibilité |
| `genre` | `VARCHAR(20)` | Genre |
| `situation_familiale` | `VARCHAR(50)` | Situation familiale |
| `nationalite` | `VARCHAR(100)` | Nationalité |
| `has_driving_license` | `BOOLEAN DEFAULT false` | Permis de conduire |
| `owns_car` | `BOOLEAN DEFAULT false` | Propriétaire d'un véhicule |
| `has_handicap` | `BOOLEAN DEFAULT false` | Situation de handicap |
| `code_postal`, `ville`, `region` | `VARCHAR` | Localisation |
| `mobilite_tn` | `BOOLEAN DEFAULT false` | Mobilité nationale |
| `mobilite_intl` | `BOOLEAN DEFAULT false` | Mobilité internationale |
| `visibility_status` | `ENUM` | `VISIBLE`, `ANONYMOUS`, `INVISIBLE` |
| `alert_frequency` | `ENUM` | `DAILY`, `TWICE_WEEK`, `WEEKLY`, `NEVER` |
| `photo_url` | `VARCHAR(500)` | URL de la photo de profil |
| `created_at` | `DATETIME` | Date de création |

---

### Table `cvs`

Table centrale du système. Stocke les documents CV avec leur texte extrait, leurs entités parsées et leur vecteur d'embedding.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | `INTEGER PK` | Identifiant |
| `id_candidate` | `INTEGER FK → candidates.id` | Candidat propriétaire (NOT NULL) |
| `id_agent` | `INTEGER FK → users.id` | Agent ayant importé (NULL si source CANDIDAT ou KEEJOB) |
| `date_depot` | `DATETIME DEFAULT NOW()` | Date d'import |
| `statut` | `ENUM` | `UPLOADED`, `PARSING`, `INDEXED`, `ERROR` |
| `source` | `ENUM` | `KEEJOB`, `AGENT`, `CANDIDAT`, `EMAIL`, `LINKEDIN` |
| `fichier_pdf` | `VARCHAR(500)` | Chemin du fichier PDF sur le disque |
| `cv_text` | `TEXT` | Texte brut extrait du PDF (OCR ou parsing direct) |
| `cv_entities` | `JSONB` | Entités structurées parsées (15+ champs) |
| `embedding` | `vector(384)` | Vecteur d'embedding pgvector (normalisé) |
| `score_final` | `FLOAT DEFAULT 0.0` | Meilleur score de matching calculé |
| `cv_version` | `INTEGER DEFAULT 1` | Numéro de version (incrémenté à chaque re-embedding) |
| `created_at` | `DATETIME` | Date de création |
| `updated_at` | `DATETIME` | Dernière modification |

**Règles métier** :
- `source=KEEJOB` → import en masse, `id_agent=NULL`
- `source=AGENT` → importé par un agent spécifique, `id_agent=agent.id`
- `source=CANDIDAT` → soumis par le candidat lui-même

---

### Table `competences`

Compétences extraites du CV lors du parsing.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | `INTEGER PK` | Identifiant |
| `id_cv` | `INTEGER FK → cvs.id` | CV parent (CASCADE DELETE) |
| `nom_competence` | `VARCHAR(255) NOT NULL` | Nom de la compétence |
| `niveau` | `ENUM` | `BEGINNER`, `INTERMEDIATE`, `EXPERT` |

---

### Table `experiences`

Expériences professionnelles extraites du CV.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | `INTEGER PK` | Identifiant |
| `id_cv` | `INTEGER FK → cvs.id` | CV parent (CASCADE DELETE) |
| `poste` | `VARCHAR(255)` | Intitulé du poste |
| `entreprise` | `VARCHAR(255)` | Nom de l'entreprise |
| `date_debut` | `VARCHAR(20)` | Date de début (format AAAA-MM) |
| `date_fin` | `VARCHAR(20)` | Date de fin (NULL si poste actuel) |
| `description` | `TEXT` | Description du poste |
| `type_contrat` | `VARCHAR(50)` | CDI, CDD, SIVP, Stage, Freelance, Alternance |
| `taille_entreprise` | `VARCHAR(50)` | <20, 20-100, 100-500, >500 salariés |
| `categorie_entreprise` | `VARCHAR(100)` | Privée TN, Étrangère, Publique |
| `secteur_activite` | `VARCHAR(255)` | Secteur d'activité |
| `missions` | `TEXT` | Liste des missions (bullet points) |
| `is_current` | `BOOLEAN DEFAULT false` | Poste actuel |

---

### Table `job_offers`

Offres d'emploi publiées par les RH.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | `INTEGER PK` | Identifiant |
| `id_rh` | `INTEGER FK → users.id` | RH créateur (NULL possible) |
| `titre` | `VARCHAR(255) NOT NULL` | Intitulé de l'offre |
| `description` | `TEXT` | Description complète du poste |
| `competences_requises` | `JSONB` | Liste des compétences requises |
| `experience_requise` | `FLOAT DEFAULT 0.0` | Années d'expérience requises |
| `langue_requise` | `VARCHAR(10) DEFAULT 'fr'` | Langue principale requise |
| `date_publication` | `DATETIME DEFAULT NOW()` | Date de publication |
| `statut` | `ENUM` | Voir section 6.4 |
| `embedding` | `vector(384)` | Vecteur pgvector de l'offre |
| `last_matching_at` | `DATETIME` | Dernier matching déclenché |
| `details` | `JSONB` | Champs étendus (lieu, type de contrat, etc.) |
| `poids_semantique` | `FLOAT DEFAULT 0.40` | Poids critère sémantique |
| `poids_competences` | `FLOAT DEFAULT 0.35` | Poids critère compétences |
| `poids_experience` | `FLOAT DEFAULT 0.15` | Poids critère expérience |
| `poids_langue` | `FLOAT DEFAULT 0.10` | Poids critère langue |
| `seuil_alerte` | `INTEGER` | Seuil de déclenchement d'alerte |
| `alerte_envoyee` | `BOOLEAN DEFAULT false` | Alerte déjà envoyée |
| `matching_auto` | `BOOLEAN DEFAULT false` | Matching automatique au seuil |
| `date_expiration` | `DATETIME` | Date d'expiration de l'offre |

---

### Table `resultats`

Table de jonction CV ↔ Offre stockant les scores de matching et la décision RH.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | `INTEGER PK` | Identifiant |
| `id_cv` | `INTEGER FK → cvs.id NOT NULL` | CV évalué |
| `id_offre` | `INTEGER FK → job_offers.id NOT NULL` | Offre cible |
| `score_matching` | `FLOAT DEFAULT 0.0` | Score cosinus sémantique |
| `score_skills` | `FLOAT DEFAULT 0.0` | Score Jaccard compétences |
| `score_experience` | `FLOAT DEFAULT 0.0` | Score adéquation expérience |
| `score_langue` | `FLOAT DEFAULT 0.0` | Score correspondance langue |
| `score_final` | `FLOAT DEFAULT 0.0` | Score pondéré final |
| `rang` | `INTEGER` | Classement dans l'offre |
| `decision` | `ENUM DEFAULT 'PENDING'` | `RETAINED`, `PENDING`, `REFUSED` |
| `date_analyse` | `DATETIME DEFAULT NOW()` | Date du dernier calcul |
| `last_score_updated_at` | `DATETIME` | Dernière mise à jour des scores |
| `feedback_rh` | `TEXT` | Commentaire du RH (NULL si pas de feedback) |
| `feedback_visible` | `BOOLEAN DEFAULT false` | Feedback visible par le candidat |
| `date_decision` | `DATETIME` | Date de la décision RH |

---

### Table `entretiens`

Entretiens planifiés, créés manuellement ou via le workflow n8n.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | `INTEGER PK` | Identifiant |
| `id_resultat` | `INTEGER FK → resultats.id` | Résultat de matching associé (NULL possible) |
| `id_offre` | `INTEGER FK → job_offers.id NOT NULL` | Offre concernée |
| `id_rh` | `INTEGER FK → users.id` | RH responsable |
| `id_candidate_user` | `INTEGER FK → users.id` | Candidat invité |
| `date_entretien` | `DATETIME NOT NULL` | Date et heure de l'entretien |
| `duree_minutes` | `INTEGER DEFAULT 30` | Durée prévue |
| `lieu` | `VARCHAR(255)` | Lieu physique |
| `type_entretien` | `VARCHAR(50) DEFAULT 'presentiel'` | présentiel, visio, téléphonique |
| `lien_visio` | `TEXT` | Lien de vidéoconférence |
| `notes_rh` | `TEXT` | Notes internes du RH |
| `statut` | `VARCHAR(20) DEFAULT 'PLANIFIE'` | Voir section 6.4 |
| `email_envoye` | `BOOLEAN DEFAULT false` | Email d'invitation envoyé |
| `n8n_execution_id` | `VARCHAR(255)` | Identifiant d'exécution n8n |
| `created_at`, `updated_at` | `DATETIME` | Horodatages |

---

### Table `audit_logs`

Journal immuable de toutes les actions utilisateur.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | `INTEGER PK` | Identifiant |
| `user_id` | `INTEGER FK → users.id (SET NULL on delete)` | Utilisateur auteur |
| `action` | `VARCHAR(100) INDEX` | Code de l'action (ex : `cv_uploaded`, `decision_taken`) |
| `resource` | `VARCHAR(100)` | Type de ressource concernée |
| `resource_id` | `INTEGER` | Identifiant de la ressource |
| `details` | `JSONB DEFAULT {}` | Détails de l'action (paramètres, valeurs avant/après) |
| `ip_address` | `VARCHAR(50)` | Adresse IP de l'auteur |
| `created_at` | `DATETIME INDEX` | Horodatage de l'action |

---

### Tables auxiliaires

| Table | Description |
|-------|-------------|
| `cover_letters` | Lettres de motivation rédigées par le candidat (`id_candidate`, `titre`, `contenu`, horodatages) |
| `candidate_documents` | Documents joints (`id_candidate`, `nom`, `fichier`, `type_doc`: CV/Diplome/CIN/Autre, `taille` en octets) |

---

## 6.2 Champs JSONB notables

### `cvs.cv_entities`

Le champ `cv_entities` est un objet JSON libre stockant toutes les entités extraites lors du parsing. Sa structure pour un CV Keejob :

```json
{
  "id_keejob": "KJ-12345",
  "titre_poste": "Développeur Full Stack",
  "nom": "Ben Ali",
  "prenom": "Mohamed",
  "age": 28,
  "email": "m.benali@example.com",
  "telephone": "+216 55 123 456",
  "adresse": "12 rue de la République",
  "code_postal": "1002",
  "ville": "Tunis",
  "niveau_etude": "BAC+5",
  "experience_annees": 3.5,
  "situation_pro": "EN_POSTE",
  "disponibilite": "1 mois",
  "permis_conduire": true,
  "salaire_souhaite": "2500 DT",
  "competences": [
    { "nom": "Python", "niveau": "EXPERT" },
    { "nom": "React", "niveau": "INTERMEDIATE" }
  ],
  "experiences": [
    {
      "poste": "Développeur Backend",
      "entreprise": "TechCorp TN",
      "date_debut": "2021-03",
      "date_fin": "2023-12",
      "type_contrat": "CDI",
      "description": "Développement d'API REST FastAPI..."
    }
  ],
  "formations": [
    {
      "diplome": "Master Informatique",
      "etablissement": "ENIT Tunis",
      "annee": "2021"
    }
  ],
  "langues": [
    { "langue": "Français", "niveau": "EXPERT" },
    { "langue": "Anglais", "niveau": "INTERMEDIATE" },
    { "langue": "Arabe", "niveau": "EXPERT" }
  ]
}
```

### `candidates.secteurs_recherche` et `metiers_recherche`

Tableaux JSON de chaînes de caractères :
```json
["IT & Développement", "Télécommunications"]
["Développeur Backend", "Architecte Logiciel"]
```

### `job_offers.details`

Champs étendus de l'offre (format libre, selon les besoins du RH) :
```json
{
  "lieu": "Tunis",
  "type_contrat": "CDI",
  "salaire_min": 2000,
  "salaire_max": 3500,
  "avantages": ["Tickets restaurant", "Télétravail"],
  "secteur": "IT"
}
```

### Extraction `formations` et `langues` pour `FullProfile`

Lors de l'appel `GET /api/candidate/profile/full`, le backend extrait les `formations` et `langues` directement du champ `cv_entities` JSONB du CV le plus récent avec statut `INDEXED`. Ces champs ne sont pas stockés dans des tables séparées — ils sont lus dynamiquement depuis le JSONB.

---

## 6.3 Vecteurs pgvector

### Configuration de l'extension

L'extension pgvector est activée à l'initialisation du container PostgreSQL :
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Colonnes vectorielles

| Table | Colonne | Type | Description |
|-------|---------|------|-------------|
| `cvs` | `embedding` | `vector(384)` | Embedding du texte CV (titre, compétences, expériences, formations, langues) |
| `job_offers` | `embedding` | `vector(384)` | Embedding du texte offre (titre, description, compétences requises) |

Les deux colonnes utilisent des **vecteurs normalisés** (norme L2 = 1), ce qui rend l'opérateur cosinus `<=>` équivalent au produit scalaire négatif — simplifiant le tri.

### Index ivfflat

```sql
-- Index sur cvs.embedding
CREATE INDEX ON cvs USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Index sur job_offers.embedding
CREATE INDEX ON job_offers USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

**Paramètre `lists = 100`** : l'espace vectoriel est partitionné en 100 clusters (listes de Voronoï). Lors d'une recherche, seuls les clusters les plus proches sont interrogés (paramètre `probes`, défaut 10 lors de la recherche). Ce compromis offre ~10–30× d'accélération par rapport à un scan séquentiel complet, avec une perte de précision < 5 % sur des données bien distribuées.

**Quand reconstruire l'index** : l'index ivfflat est construit une fois et reste performant. Lors d'ajouts massifs de vecteurs (>10 000), il est recommandé de le reconstruire avec `REINDEX`.

---

## 6.4 Workflow de statuts

### Statuts CV (`cvs.statut`)

```
UPLOADED → PARSING → INDEXED
             ↓
           ERROR
```

| Statut | Description |
|--------|-------------|
| `UPLOADED` | Fichier déposé, en attente de traitement Celery |
| `PARSING` | Tâche Celery en cours (extraction texte + parsing + embedding) |
| `INDEXED` | CV entièrement traité, embedding disponible, résultats calculés |
| `ERROR` | Échec du traitement (OCR insuffisant, PDF corrompu, etc.) |

### Statuts de candidature (timeline candidat)

Les 4 étapes de la timeline sont dérivées de l'état du `Resultat` :

| Étape | Condition | Libellé affiché |
|-------|-----------|-----------------|
| 1 - POSTULÉ | `Resultat` créé | Candidature soumise |
| 2 - ANALYSE IA | `cvs.statut = INDEXED` | CV analysé par l'IA |
| 3 - EN EXAMEN | `Resultat` consulté par le RH | Dossier en cours d'examen |
| 4 - DÉCISION | `decision ≠ PENDING` | Décision prise |

### Statuts d'entretien (`entretiens.statut`)

```
PLANIFIE → PROPOSE → CONFIRME → ENVOYE
    ↓
  ANNULE
```

| Statut | Description |
|--------|-------------|
| `PLANIFIE` | Entretien créé manuellement par le RH |
| `PROPOSE` | Créneau généré automatiquement par n8n, en attente de confirmation candidat |
| `CONFIRME` | Candidat a confirmé sa présence |
| `ENVOYE` | Email d'invitation envoyé via `mailer.py` |
| `ANNULE` | Entretien annulé |

### Statuts d'offre (`job_offers.statut`)

```
BROUILLON → EN_VALIDATION → PROCHAINEMENT → ACTIVE
    ↓               ↓                          ↓
ARCHIVED       ARCHIVED                   DESACTIVEE → ARCHIVED
                                              ↓
                                           EXPIREE → ARCHIVED
REFUSEE → BROUILLON (correction)
```

| Statut | Description |
|--------|-------------|
| `BROUILLON` | Offre en cours de rédaction, non publiée |
| `EN_VALIDATION` | Soumise pour validation interne |
| `PROCHAINEMENT` | Planifiée pour une publication future |
| `ACTIVE` | Publiée et visible aux candidats |
| `DESACTIVEE` | Temporairement masquée sans suppression |
| `EXPIREE` | Date d'expiration dépassée |
| `ARCHIVED` / `ARCHIVEE` | État terminal, plus modifiable |
| `REFUSEE` | Refusée lors de la validation (retour en BROUILLON possible) |
