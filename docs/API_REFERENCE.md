# API Reference — ATS RANDA

Documentation complète de tous les endpoints REST.

**Base URL :** `http://localhost:8000`
**Interactive docs :** `http://localhost:8000/docs`

---

## Authentification

Tous les endpoints protégés nécessitent un header :
```
Authorization: Bearer <token>
```

Obtenir un token via `POST /api/visitor/login`.

---

## Table des matières

1. [Auth](#1-auth)
2. [Visitor — Offres](#2-visitor--offres)
3. [Agent — CVs](#3-agent--cvs)
4. [Agent — Import Keejob](#4-agent--import-keejob)
5. [Agent — Candidats](#5-agent--candidats)
6. [RH — Offres](#6-rh--offres)
7. [RH — Dashboard](#7-rh--dashboard)
8. [Candidat — CVs](#8-candidat--cvs)
9. [Admin — Utilisateurs](#9-admin--utilisateurs)

---

## 1. Auth

### POST `/api/visitor/register`
Crée un compte candidat.

**Body (JSON)**
```json
{
  "nom": "Ben Ali",
  "prenom": "Sami",
  "email": "sami@example.com",
  "password": "motdepasse123"
}
```

**Réponse 201**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```

---

### POST `/api/visitor/login`
Connexion — retourne un JWT.

**Body (JSON)**
```json
{
  "email": "sami.agent@randa.tn",
  "password": "agent123"
}
```

**Réponse 200**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Curl**
```bash
curl -X POST http://localhost:8000/api/visitor/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sami.agent@randa.tn","password":"agent123"}'
```

---

## 2. Visitor — Offres

### GET `/api/visitor/offers`
Liste les offres actives (public, sans token).

**Query params**

| Param | Type | Défaut | Description |
|-------|------|--------|-------------|
| `search` | string | — | Recherche dans le titre |
| `page` | int | 1 | Numéro de page |
| `limit` | int | 20 | Résultats par page (max 100) |

**Réponse 200**
```json
{
  "total": 12,
  "offers": [
    {
      "id": 1,
      "titre": "Développeur Full Stack",
      "description": "Nous recherchons...",
      "competences_requises": ["Python", "React"],
      "experience_requise": 3.0,
      "langue_requise": "fr",
      "date_publication": "2026-03-14T10:00:00Z",
      "statut": "ACTIVE"
    }
  ]
}
```

**Curl**
```bash
curl "http://localhost:8000/api/visitor/offers?search=développeur&page=1&limit=10"
```

---

### GET `/api/visitor/offers/{offer_id}`
Détail d'une offre active.

**Curl**
```bash
curl http://localhost:8000/api/visitor/offers/1
```

---

## 3. Agent — CVs

> Rôle requis : `AGENT`

### POST `/api/agent/cvs/upload`
Upload un CV physique (photo ou PDF) avec OCR automatique.

**Form-data**

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `file` | fichier | Oui | JPEG / PNG / WebP / PDF (max 10 MB) |
| `nom` | string | Oui | Nom du candidat |
| `prenom` | string | Oui | Prénom du candidat |
| `email` | string | Non | Email (pour déduplication) |
| `telephone` | string | Non | Téléphone |

**Curl**
```bash
curl -X POST http://localhost:8000/api/agent/cvs/upload \
  -H "Authorization: Bearer <TOKEN>" \
  -F "file=@cv_scan.jpg" \
  -F "nom=Ben Salah" \
  -F "prenom=Saif" \
  -F "email=saif@example.com"
```

---

### GET `/api/agent/cvs`
Liste tous les CVs avec filtres.

**Query params**

| Param | Type | Défaut | Description |
|-------|------|--------|-------------|
| `source` | string | — | `KEEJOB` \| `AGENT` \| `CANDIDAT` \| `EMAIL` \| `LINKEDIN` |
| `statut` | string | — | `UPLOADED` \| `PARSING` \| `INDEXED` \| `ERROR` |
| `search` | string | — | Recherche nom / prénom / email candidat |
| `page` | int | 1 | Numéro de page |
| `limit` | int | 20 | Résultats par page (max 100) |

**Réponse 200**
```json
{
  "total": 4130,
  "page": 1,
  "pages": 207,
  "cvs": [
    {
      "id": 1,
      "id_candidate": 1,
      "id_agent": null,
      "statut": "INDEXED",
      "source": "KEEJOB",
      "date_depot": "2026-03-13T04:00:00Z",
      "fichier_pdf": "/app/uploads/keejob/cv_keejob_1908.pdf"
    }
  ]
}
```

**Curl**
```bash
# Tous les CVs Keejob indexés
curl "http://localhost:8000/api/agent/cvs?source=KEEJOB&statut=INDEXED" \
  -H "Authorization: Bearer <TOKEN>"

# Recherche par nom
curl "http://localhost:8000/api/agent/cvs?search=Mohamed&page=1&limit=20" \
  -H "Authorization: Bearer <TOKEN>"
```

---

### GET `/api/agent/cvs/{cv_id}`
Détail complet d'un CV avec les entités extraites.

**Réponse 200**
```json
{
  "id": 42,
  "id_candidate": 15,
  "id_agent": null,
  "statut": "INDEXED",
  "source": "KEEJOB",
  "date_depot": "2026-03-13T04:00:00Z",
  "fichier_pdf": "/app/uploads/keejob/cv_keejob_1908.pdf",
  "cv_entities": {
    "titre_poste": "INGENIEUR AGRONOME",
    "nom": "Ben Salah",
    "prenom": "Saif Eddine",
    "age": 42,
    "email": "saifagro@hotmail.fr",
    "telephone": "+21622275410",
    "niveau_etude": "BAC+5",
    "experience_annees": 16.17,
    "competences": [{"nom_competence": "Excel", "niveau": "EXPERT"}],
    "experiences": [{"poste": "RESPONSABLE DE PRODUCTION", "entreprise": "SMVDA"}],
    "formations": [{"diplome": "Ingénieur", "type": "Universitaire"}],
    "langues": [{"langue": "Arabe", "niveau": "EXPERT"}]
  },
  "candidate": {
    "id": 15,
    "nom": "Ben Salah",
    "prenom": "Saif Eddine",
    "email": "saifagro@hotmail.fr",
    "telephone": "+21622275410"
  }
}
```

**Curl**
```bash
curl http://localhost:8000/api/agent/cvs/42 \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 4. Agent — Import Keejob

> Rôle requis : `AGENT`

### POST `/api/agent/import/keejob`
Importe un CV au format PDF Keejob — parsing automatique de toutes les entités.

**Restrictions**
- Type : `application/pdf` uniquement
- Taille max : 10 MB

**Curl**
```bash
curl -X POST http://localhost:8000/api/agent/import/keejob \
  -H "Authorization: Bearer <TOKEN>" \
  -F "file=@cv_keejob_1908.pdf;type=application/pdf"
```

**Réponse 201**
```json
{
  "cv_id": 4131,
  "candidate_id": 4128,
  "candidate_created": true,
  "statut": "INDEXED",
  "source": "AGENT",
  "fichier": "cv_keejob_1908.pdf",
  "nb_caracteres": 3307,
  "entities": {
    "id_keejob": "1908",
    "titre_poste": "INGENIEUR AGRONOME",
    "nom": "Ben Salah",
    "prenom": "Saif Eddine",
    "age": 42,
    "email": "saifagro@hotmail.fr",
    "telephone": "+21622275410",
    "ville": "Tunis",
    "niveau_etude": "BAC+5",
    "experience_annees": 16.17,
    "situation_pro": "En poste",
    "disponibilite": "Avec préavis",
    "permis_conduire": true,
    "salaire_souhaite": null,
    "nb_competences": 3,
    "nb_experiences": 2,
    "nb_formations": 1,
    "nb_langues": 3,
    "resume": "Jeune ingénieur compétent..."
  },
  "message": "CV Keejob importé avec succès — nouveau candidat créé"
}
```

---

## 5. Agent — Candidats

> Rôle requis : `AGENT`

### GET `/api/agent/candidates`
Liste tous les candidats avec recherche et pagination.

**Query params**

| Param | Type | Défaut | Description |
|-------|------|--------|-------------|
| `search` | string | — | Recherche nom / prénom / email |
| `page` | int | 1 | Numéro de page |
| `limit` | int | 20 | Résultats par page (max 100) |

**Réponse 200**
```json
{
  "total": 4127,
  "page": 1,
  "pages": 207,
  "candidates": [
    {
      "id": 1,
      "nom": "Ben Salah",
      "prenom": "Saif Eddine",
      "email": "saifagro@hotmail.fr",
      "telephone": "+21622275410",
      "adresse": "2015 Tunis, Tunisie",
      "date_naissance": "1984",
      "created_at": "2026-03-13T04:00:00Z"
    }
  ]
}
```

**Curl**
```bash
curl "http://localhost:8000/api/agent/candidates?search=Ahmed&limit=10" \
  -H "Authorization: Bearer <TOKEN>"
```

---

### GET `/api/agent/candidates/{candidate_id}`
Profil complet d'un candidat avec la liste de ses CVs.

**Réponse 200**
```json
{
  "id": 1,
  "nom": "Ben Salah",
  "prenom": "Saif Eddine",
  "email": "saifagro@hotmail.fr",
  "telephone": "+21622275410",
  "adresse": "2015 Tunis, Tunisie",
  "date_naissance": "1984",
  "created_at": "2026-03-13T04:00:00Z",
  "nb_cvs": 1,
  "cvs": [
    {
      "id": 42,
      "statut": "INDEXED",
      "source": "KEEJOB",
      "date_depot": "2026-03-13T04:00:00Z",
      "fichier_pdf": "/app/uploads/keejob/cv_keejob_1908.pdf"
    }
  ]
}
```

**Curl**
```bash
curl http://localhost:8000/api/agent/candidates/1 \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 6. RH — Offres

> Rôle requis : `RH`

### GET `/api/rh/offers`
Liste les offres du RH connecté.

**Query params**

| Param | Type | Description |
|-------|------|-------------|
| `statut` | string | `ACTIVE` \| `INACTIVE` \| `ARCHIVED` |
| `page` | int | Numéro de page |
| `limit` | int | Résultats par page |

**Curl**
```bash
curl "http://localhost:8000/api/rh/offers?statut=ACTIVE" \
  -H "Authorization: Bearer <TOKEN_RH>"
```

---

### POST `/api/rh/offers`
Crée une nouvelle offre d'emploi.

**Body (JSON)**
```json
{
  "titre": "Développeur Backend Python",
  "description": "Nous cherchons un développeur expérimenté en Python/FastAPI...",
  "competences_requises": ["Python", "FastAPI", "PostgreSQL", "Docker"],
  "experience_requise": 3.0,
  "langue_requise": "fr"
}
```

**Réponse 201**
```json
{
  "id": 5,
  "titre": "Développeur Backend Python",
  "description": "Nous cherchons un développeur expérimenté...",
  "competences_requises": ["Python", "FastAPI", "PostgreSQL", "Docker"],
  "experience_requise": 3.0,
  "langue_requise": "fr",
  "date_publication": "2026-03-14T10:00:00Z",
  "plateforme_source": "randa",
  "statut": "ACTIVE",
  "id_rh": 2
}
```

**Curl**
```bash
curl -X POST http://localhost:8000/api/rh/offers \
  -H "Authorization: Bearer <TOKEN_RH>" \
  -H "Content-Type: application/json" \
  -d '{
    "titre": "Développeur Backend Python",
    "description": "Description du poste...",
    "competences_requises": ["Python", "FastAPI"],
    "experience_requise": 3.0,
    "langue_requise": "fr"
  }'
```

---

### GET `/api/rh/offers/{offer_id}`
Détail d'une offre.

```bash
curl http://localhost:8000/api/rh/offers/5 \
  -H "Authorization: Bearer <TOKEN_RH>"
```

---

### PUT `/api/rh/offers/{offer_id}`
Modifie une offre existante (champs partiels acceptés).

**Body (JSON)**
```json
{
  "titre": "Développeur Backend Senior",
  "experience_requise": 5.0
}
```

---

### DELETE `/api/rh/offers/{offer_id}`
Archive une offre (statut → `ARCHIVED`).

```bash
curl -X DELETE http://localhost:8000/api/rh/offers/5 \
  -H "Authorization: Bearer <TOKEN_RH>"
```

---

## 7. RH — Dashboard

> Rôle requis : `RH`

### GET `/api/rh/dashboard`
Statistiques globales de la plateforme.

**Réponse 200**
```json
{
  "candidates": {
    "total": 4127
  },
  "cvs": {
    "total": 4130,
    "new_7_days": 18,
    "by_statut": {
      "INDEXED": 4128,
      "ERROR": 2
    },
    "by_source": {
      "KEEJOB": 4130
    }
  },
  "offers": {
    "total": 8,
    "active": 5,
    "my_total": 3,
    "my_active": 2
  }
}
```

**Curl**
```bash
curl http://localhost:8000/api/rh/dashboard \
  -H "Authorization: Bearer <TOKEN_RH>"
```

---

## 8. Candidat — CVs

> Rôle requis : `CANDIDATE`

### POST `/api/candidate/cvs/upload`
Le candidat dépose son propre CV.

**Form-data**

| Champ | Type | Description |
|-------|------|-------------|
| `file` | fichier | PDF, JPEG, PNG, WebP (max 10 MB) |

---

### GET `/api/candidate/cvs`
Liste les CVs du candidat connecté.

```bash
curl http://localhost:8000/api/candidate/cvs \
  -H "Authorization: Bearer <TOKEN_CANDIDAT>"
```

---

### GET `/api/candidate/cvs/{cv_id}`
Détail d'un CV du candidat.

---

### GET `/api/candidate/candidatures`
Liste les candidatures (résultats de matching) du candidat.

```bash
curl "http://localhost:8000/api/candidate/candidatures?page=1&limit=10" \
  -H "Authorization: Bearer <TOKEN_CANDIDAT>"
```

---

## 9. Admin — Utilisateurs

> Rôle requis : `ADMIN`

### GET `/api/admin/users`
Liste tous les utilisateurs.

**Query params**

| Param | Type | Description |
|-------|------|-------------|
| `role` | string | Filtrer par rôle (`AGENT`, `RH`, `CANDIDATE`…) |
| `is_active` | bool | Filtrer par statut actif |
| `page` | int | Numéro de page |
| `limit` | int | Résultats par page |

---

### POST `/api/admin/users`
Crée un utilisateur (tous rôles).

**Body (JSON)**
```json
{
  "nom": "Trabelsi",
  "prenom": "Sami",
  "email": "sami.agent@randa.tn",
  "password": "agent123",
  "role": "AGENT",
  "departement": "Recrutement"
}
```

---

### GET `/api/admin/users/{user_id}`
Détail d'un utilisateur.

---

### PUT `/api/admin/users/{user_id}`
Modifie un utilisateur.

---

### PATCH `/api/admin/users/{user_id}/toggle`
Active ou désactive un compte utilisateur.

```bash
curl -X PATCH http://localhost:8000/api/admin/users/3/toggle \
  -H "Authorization: Bearer <TOKEN_ADMIN>"
```

---

## Codes d'erreur communs

| Code | Signification |
|------|---------------|
| `400` | Requête invalide (type de fichier, taille, champ manquant) |
| `401` | Token manquant ou expiré |
| `403` | Rôle insuffisant |
| `404` | Ressource introuvable |
| `422` | Données invalides (validation Pydantic) |

---

## Énumérations

### CVStatus
| Valeur | Description |
|--------|-------------|
| `UPLOADED` | Fichier reçu, pas encore traité |
| `PARSING` | Extraction en cours |
| `INDEXED` | Parsé et prêt pour le matching |
| `ERROR` | Erreur lors du traitement |

### CVSource
| Valeur | Description |
|--------|-------------|
| `KEEJOB` | Import bulk depuis Keejob |
| `AGENT` | Upload manuel par un agent |
| `CANDIDAT` | Dépôt candidat via portail *(futur)* |
| `EMAIL` | Parsing email entrant *(futur)* |
| `LINKEDIN` | Import LinkedIn *(futur)* |

### SkillLevel
| Valeur | Description |
|--------|-------------|
| `BEGINNER` | Débutant / Notions |
| `INTERMEDIATE` | Intermédiaire / Moyen |
| `EXPERT` | Avancé / Expert / Courant |

### OfferStatus
| Valeur | Description |
|--------|-------------|
| `ACTIVE` | Offre visible et ouverte |
| `INACTIVE` | Temporairement suspendue |
| `ARCHIVED` | Fermée définitivement |

### Decision
| Valeur | Description |
|--------|-------------|
| `PENDING` | En attente d'évaluation |
| `RETAINED` | Candidature retenue |
| `REFUSED` | Candidature refusée |
