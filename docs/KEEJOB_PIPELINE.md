# Pipeline d'Import et de Parsing des CVs Keejob

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Structure réelle d'un CV Keejob](#2-structure-réelle-dun-cv-keejob)
3. [Fichiers du pipeline](#3-fichiers-du-pipeline)
4. [keejob_parser.py — Parsing](#4-keejob_parserpy--parsing)
5. [keejob_importer.py — Import en masse](#5-keejob_importerpy--import-en-masse)
6. [import_keejob.py — Route API](#6-import_keejobpy--route-api)
7. [Base de données](#7-base-de-données)
8. [Résultats de l'import initial](#8-résultats-de-limport-initial)
9. [Commandes utiles](#9-commandes-utiles)

---

## 1. Vue d'ensemble

```
PDF Keejob
    │
    ▼
pdfplumber.extract_text()          ← extraction texte brut (toutes pages)
    │
    ▼
keejob_parser.parse_keejob_cv()    ← parsing regex → dict structuré
    │
    ├─► header        → nom, prénom, âge, email, téléphone, ville,
    │                   niveau_etude, experience_annees, situation_pro,
    │                   disponibilite, permis_conduire, salaire_souhaite,
    │                   id_keejob, titre_poste
    │
    ├─► competences   → [{ nom_competence, niveau }]
    ├─► langues       → [{ langue, niveau }]
    ├─► experiences   → [{ poste, type_contrat, entreprise, secteur,
    │                       ville, date_debut, date_fin, duree, description }]
    ├─► formations    → [{ diplome, type, statut, mention,
    │                       date_debut, date_fin, etablissement, pays }]
    └─► resume        → texte libre (Points Forts)
    │
    ▼
PostgreSQL
    ├─► candidates    (nom, prénom, email, téléphone, adresse)
    ├─► cvs           (cv_text, cv_entities JSONB, statut = INDEXED)
    ├─► competences   (nom_competence, niveau : BEGINNER/INTERMEDIATE/EXPERT)
    └─► experiences   (poste, entreprise, date_debut, date_fin, description)
```

---

## 2. Structure réelle d'un CV Keejob

Les CVs exportés depuis **Keejob.com** sont des PDFs à **layout 2 colonnes**.
`pdfplumber` fusionne les colonnes ligne par ligne, ce qui donne :

```
INGENIEUR AGRONOME                          ← titre (pleine largeur)
Saif Eddine Ben    Étude: Bac + 5           ← col-gauche + col-droite
Salah              Expérience: 16 années, 2 mois
42 ans             Situation professionnelle: En poste
11 rue agim,       Disponibilité: Avec préavis
2015 Tunis Tunisie Permis de conduire: oui
+216 22275410      ID Keejob: 1908
saifagro@hotmail.fr

POINTS FORTS/RÉSUMÉ
jeune ingénieur compétent...

EXPÉRIENCES PROFESSIONNELLES
RESPONSABLE DE PRODUCTION CDI
Juin 2010 - Aujourd'hui (15 années, 8 mois)
SMVDA NARJESS | agriculture / agro-alimentaire / environnement | Nabeul, Tunisie
Description du poste...

DIPLÔMES ET FORMATIONS
diplome national d'ingénieur Universitaire
2007 Ecole Supérieure d'Agriculture du Kef | Tunisie

COMPÉTENCES
Word (Avancé) Excel (Avancé) PowerPoint (Intermédiaire)

LANGUES
Arabe Courant
Français Avancé
Anglais Intermédiaire

CENTRES D'INTÉRÊT
foot, lecture
```

### Fichiers identifiables
Les exports Keejob natifs sont nommés `cv_keejob_NNNNN.pdf` (ex: `cv_keejob_1908.pdf`).
Les autres PDFs dans le même dossier sont des CVs au format libre (non Keejob).

---

## 3. Fichiers du pipeline

| Fichier | Rôle |
|---------|------|
| `backend/app/nlp/keejob_parser.py` | Parseur regex pur — aucune dépendance NLP |
| `backend/app/nlp/keejob_importer.py` | Script CLI d'import en masse |
| `backend/app/api/routes/agent/import_keejob.py` | Route FastAPI `POST /api/agent/import/keejob` |
| `backend/app/repositories/cv_repository.py` | Méthodes `add_competences()`, `add_experiences()`, `list_by_agent()` |

---

## 4. keejob_parser.py — Parsing

### Dépendances
```
re, datetime  (stdlib uniquement — pas de spaCy, pas de transformers)
pdfplumber    (appelé en amont par l'importeur ou la route API)
```

### Fonction principale
```python
from app.nlp.keejob_parser import parse_keejob_cv

entities = parse_keejob_cv(cv_text)  # cv_text = texte brut pdfplumber
```

### Structure du dict retourné
```python
{
  # Métadonnées
  "source":            "keejob",
  "id_keejob":         "1908",
  "parsed_at":         "2026-03-13T04:00:00",

  # En-tête
  "titre_poste":       "INGENIEUR AGRONOME",
  "nom":               "Ben Salah",
  "prenom":            "Saif Eddine",
  "age":               42,
  "email":             "saifagro@hotmail.fr",
  "telephone":         "+21622275410",
  "adresse":           "2015 Tunis, Tunisie",
  "ville":             "Tunis",

  # Profil
  "niveau_etude":      "BAC+5",        # voir mapping ci-dessous
  "experience_annees": 16.17,          # années + mois/12, arrondi 2 décimales
  "situation_pro":     "En poste",
  "disponibilite":     "Avec préavis",
  "permis_conduire":   True,
  "salaire_souhaite":  1200,           # None si absent

  # Sections structurées
  "resume":      "Texte libre de la section Points Forts...",
  "competences": [{ "nom_competence": "Excel",      "niveau": "EXPERT" }],
  "langues":     [{ "langue": "Arabe",              "niveau": "EXPERT" }],
  "experiences": [{
    "poste":        "RESPONSABLE DE PRODUCTION",
    "type_contrat": "CDI",
    "entreprise":   "SMVDA NARJESS",
    "secteur":      "agriculture / agro-alimentaire / environnement",
    "ville":        "Nabeul",
    "date_debut":   "2010-06",
    "date_fin":     None,              # None = poste actuel
    "duree":        "15 années, 8 mois",
    "description":  "9O ha AGRUME..."
  }],
  "formations":  [{
    "diplome":       "diplome national d'ingénieur",
    "type":          "Universitaire",
    "statut":        "Obtenu",
    "mention":       "Assez Bien",
    "date_debut":    None,
    "date_fin":      "2007",
    "etablissement": "Ecole Supérieure d'Agriculture du Kef",
    "pays":          "Tunisie"
  }]
}
```

### Mappings

#### Niveau d'études
| Keejob | Interne |
|--------|---------|
| Bac | BAC |
| Bac + 2 | BAC+2 |
| Bac + 3 | BAC+3 |
| Bac + 4 | BAC+4 |
| Bac + 5 | BAC+5 |
| Formations professionnelles | BAC |
| Doctorat | Doctorat |
| Primaire | Primaire |
| Secondaire | Secondaire |

#### Niveau de compétence / langue → `SkillLevel`
| Keejob | Enum DB |
|--------|---------|
| Débutant / Notions | `BEGINNER` |
| Intermédiaire / Moyen | `INTERMEDIATE` |
| Avancé / Expert / Courant / Bilingue | `EXPERT` |

#### Durée d'expérience
```
"11 années, 9 mois" → 11 + 9/12 = 11.75
"3 mois"            → 0.25
"18 années"         → 18.0
```

### Découpage en sections
Le texte est découpé par des marqueurs regex (insensible à la casse) :

| Marqueur | Clé interne |
|----------|-------------|
| `POINTS FORTS` / `RÉSUMÉ` | `resume` |
| `EXPÉRIENCES PROFESSIONNELLES` | `experiences` |
| `DIPLÔMES ET FORMATIONS` | `formations` |
| `COMPÉTENCES` | `competences` |
| `LANGUES` | `langues` |
| `CENTRES D'INTÉRÊT` / `LOISIRS` | `interets` (ignoré) |
| `LETTRE DE MOTIVATION` | `_stop` (tronque le texte) |

### Parsing des compétences — cas particuliers
Keejob peut mettre plusieurs compétences sur une seule ligne :
```
Word (Avancé) Excel (Avancé) Analyse physico-chimique (Avancé)
```
Le parser extrait chaque item via `findall(r"(.+?)\s*\(Avancé|Intermédiaire|...\)")`.

### Parsing des formations — formats observés
```
# Format A : type en fin de ligne (le plus fréquent)
Licence appliquée Universitaire
Obtenu | Mention Bien Septembre/2009 - Mai/2013
Institut supérieur | Tunisie

# Format B : type sur ligne séparée
Licence appliquée en agroalimentaire (contrôle qualité)
Universitaire
Obtenu | Mention Bien Septembre/2009 - Mai/2013
Institut supérieur | Tunisie

# Format C : année + école sur même ligne
diplome national d'ingénieur Universitaire
2007 Ecole Supérieure d'Agriculture du Kef | Tunisie

# Format D : mention + année fusionnés
Maitrise en Sciences Techniques Universitaire
Mention Assez Bien 2007
Ecole Supérieure des Sciences et Techniques | Tunisie
```

> ⚠️ **Point critique :** la détection du type (Universitaire/Formation) utilise un anchor `$`
> pour chercher le type en **fin de ligne uniquement**. Sans cela, "professionnel" dans
> "Master **professionnel** en développement durable Universitaire" serait capturé à tort.

---

## 5. keejob_importer.py — Import en masse

### Usage CLI
```bash
# Depuis le dossier backend/
python -m app.nlp.keejob_importer /chemin/vers/dossier

# Avec options
python -m app.nlp.keejob_importer /chemin --agent-id 4
python -m app.nlp.keejob_importer /chemin --dry-run          # simulation sans DB
python -m app.nlp.keejob_importer /chemin --all-pdfs         # tous les PDFs (pas que cv_keejob_*)

# Depuis Docker
docker exec ats_backend sh -c "cd /app && python -m app.nlp.keejob_importer /app/uploads/keejob --agent-id 4"
```

### Comportement par défaut
- Recherche récursive des fichiers `cv_keejob_*.pdf` uniquement
- Un CV qui plante **n'arrête pas** l'import (catch Exception par CV)
- Déduplique par email (candidat existant + CV existant → skip)
- Statut du CV créé : `INDEXED`

### Flux par PDF
```
1. pdfplumber → texte brut (toutes pages)
2. parse_keejob_cv() → entities dict
3. candidate_repository.get_or_create() → candidat (ou skip si email existe + CV existant)
4. cv_repository.create() → CV avec cv_entities = entities (JSONB complet)
5. cv_repository.add_competences() → table competences
6. cv_repository.add_experiences() → table experiences
7. Log : ✓ importé / ⚠ doublon / ✗ erreur
```

### Résumé affiché en fin d'import
```
============================================================
RÉSUMÉ D'IMPORT
============================================================
✓ Importés  : 2474
⚠ Doublons  : 422
✗ Erreurs   : 0
  TOTAL     : 2896
```

---

## 6. import_keejob.py — Route API

### Endpoint
```
POST /api/agent/import/keejob
Authorization: Bearer <token_agent>
Content-Type: multipart/form-data
Body: file = <PDF Keejob>
```

### Restrictions
- Rôle requis : `AGENT`
- Type accepté : `application/pdf` uniquement
- Taille max : 10 MB

### Réponse (201 Created)
```json
{
  "cv_id": 6,
  "candidate_id": 3,
  "candidate_created": true,
  "statut": "INDEXED",
  "fichier": "cv_keejob_109066.pdf",
  "nb_caracteres": 3307,
  "entities": {
    "id_keejob": "109066",
    "titre_poste": "Technicien supérieur en mecatronique",
    "nom": "Melek",
    "prenom": "Mzoughui",
    "age": 33,
    "email": "mzoughui.melek@gmail.com",
    "telephone": "+21658052966",
    "ville": "Tunis",
    "niveau_etude": "BAC+3",
    "experience_annees": 11.0,
    "situation_pro": "Disponible",
    "disponibilite": "Immédiate",
    "permis_conduire": true,
    "salaire_souhaite": null,
    "nb_competences": 2,
    "nb_experiences": 5,
    "nb_formations": 1,
    "nb_langues": 4,
    "resume": "Je suis le genre social, motivé..."
  },
  "message": "CV Keejob importé avec succès — nouveau candidat créé"
}
```

---

## 7. Base de données

### Tables alimentées

#### `candidates`
```sql
nom, prenom, email, telephone, adresse, date_naissance (≈ année, déduite de l'âge)
```

#### `cvs`
```sql
id_candidate, id_agent, statut = 'INDEXED',
fichier_pdf,     -- chemin ou nom du fichier original
cv_text,         -- texte brut complet (toutes pages)
cv_entities      -- JSONB : dict complet retourné par parse_keejob_cv()
                 -- contient TOUT : experiences, formations, langues, resume...
```

> Le champ `cv_entities` est intentionnellement complet : il sert de source de vérité
> pour les futures étapes (embedding, scoring, matching) sans relire le PDF.

#### `competences`
```sql
id_cv, nom_competence, niveau  -- BEGINNER | INTERMEDIATE | EXPERT
```

#### `experiences`
```sql
id_cv, poste, entreprise, date_debut, date_fin, description
```

### Méthodes ajoutées à `cv_repository.py`

```python
# Insère les compétences extraites pour un CV
async def add_competences(db, cv_id, competences: list[dict]) -> None

# Insère les expériences extraites pour un CV
async def add_experiences(db, cv_id, experiences: list[dict]) -> None

# Liste les CVs d'un agent (avec filtre statut optionnel)
async def list_by_agent(db, agent_id, statut=None, skip=0, limit=20) -> tuple[int, list[CV]]
```

---

## 8. Résultats de l'import initial

**Date :** 13 mars 2026
**Source :** `C:\Users\hssan\projet\pfe\Keejob\cv\` (32 sous-dossiers métiers)
**Dossier container :** `/app/uploads/keejob/`

| Métrique | Valeur |
|----------|--------|
| PDFs traités | 2 896 |
| CVs importés | **2 474** |
| Doublons ignorés | 422 |
| Erreurs | **0** |

### Distribution des niveaux d'études (après import)
| Niveau | Candidats |
|--------|-----------|
| BAC+5 | 1 003 |
| BAC+3 | 611 |
| BAC+4 | 250 |
| BAC | 191 |
| BAC+2 | 113 |
| Doctorat | 17 |
| Non détecté | 253 |

### État final de la base
| Table | Lignes |
|-------|--------|
| candidates | 2 477 |
| cvs (INDEXED) | 2 476 |
| competences | 6 374 |
| experiences | 7 737 |

---

## 9. Commandes utiles

### Relancer l'import complet
```bash
docker exec ats_backend sh -c "cd /app && python -m app.nlp.keejob_importer /app/uploads/keejob --agent-id 4"
```

### Dry run (simulation sans écriture DB)
```bash
docker exec ats_backend sh -c "cd /app && python -m app.nlp.keejob_importer /app/uploads/keejob --dry-run"
```

### Tester le parser sur un PDF
```bash
docker exec ats_backend python -c "
import pdfplumber, json, sys
sys.path.insert(0, '/app')
from app.nlp.keejob_parser import parse_keejob_cv

parts = []
with pdfplumber.open('/app/uploads/keejob/Ingénieur AgronomeH7283/cv_keejob_1908.pdf') as pdf:
    for page in pdf.pages:
        t = page.extract_text()
        if t: parts.append(t)

result = parse_keejob_cv('\n'.join(parts))
print(json.dumps(result, indent=2, ensure_ascii=False))
"
```

### Tester l'API via curl (depuis le container)
```bash
# 1. Obtenir un token agent
curl -X POST http://localhost:8000/api/visitor/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sami.agent@randa.tn","password":"agent123"}'

# 2. Importer un CV
curl -X POST http://localhost:8000/api/agent/import/keejob \
  -H "Authorization: Bearer <TOKEN>" \
  -F "file=@/chemin/vers/cv_keejob_NNNNN.pdf;type=application/pdf"
```

### Stats rapides en base
```bash
docker exec ats_backend python -c "
import asyncio, sys
sys.path.insert(0, '/app')
from app.core.database import AsyncSessionLocal
from sqlalchemy import text

async def main():
    async with AsyncSessionLocal() as db:
        for t in ['candidates','cvs','competences','experiences']:
            r = await db.execute(text(f'SELECT COUNT(*) FROM {t}'))
            print(f'{t}: {r.scalar()}')

asyncio.run(main())
"
```
