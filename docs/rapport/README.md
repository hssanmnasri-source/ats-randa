# Documentation Technique — ATS RANDA

Documentation technique complète du système ATS RANDA, rédigée en français professionnel.

## Table des fichiers

| # | Fichier | Description | Taille estimée |
|---|---------|-------------|----------------|
| 0 | [00_resume_executif.md](00_resume_executif.md) | Présentation du projet, contexte, objectifs, chiffres clés et valeur ajoutée | 2–3 pages |
| 1 | [01_architecture_globale.md](01_architecture_globale.md) | Architecture 3-tiers, backend FastAPI, base de données, frontend React, mobile Flutter, infrastructure Docker | 5–7 pages |
| 2 | [02_fonctionnalites_par_role.md](02_fonctionnalites_par_role.md) | Fonctionnalités détaillées pour chaque rôle : Visiteur, Candidat, Agent, RH, Admin | 8–10 pages |
| 3 | [03_pipeline_nlp.md](03_pipeline_nlp.md) | Pipeline NLP complet : OCR, parsing, embeddings, algorithme de scoring multi-critères, tâches Celery | 5–6 pages |
| 4 | [04_api_reference.md](04_api_reference.md) | Référence complète de toutes les routes API (~65 endpoints) par groupe | 6–8 pages |
| 5 | [05_modele_donnees.md](05_modele_donnees.md) | Modèle de données : 12 tables, champs JSONB, vecteurs pgvector, workflows de statuts | 4–5 pages |
| 6 | [06_guide_installation.md](06_guide_installation.md) | Guide d'installation pas à pas, commandes Makefile, URLs des services, premiers pas | 3–4 pages |
| 7 | [07_securite.md](07_securite.md) | JWT, bcrypt, RBAC, OAuth2 Google, CORS, isolation agent_id, sécurité webhooks | 2–3 pages |
| 8 | [08_application_mobile.md](08_application_mobile.md) | Application Flutter RH : architecture Riverpod/GoRouter, fonctionnalités, synchronisation | 4–5 pages |
| 9 | [09_workflows_n8n.md](09_workflows_n8n.md) | Automatisation n8n : rôle, workflows entretiens, routes dédiées, sécurité webhooks | 2 pages |
| 10 | [10_glossaire.md](10_glossaire.md) | Glossaire de 25+ termes techniques définis en français | 2 pages |
| 11 | [11_diagrammes_uml.md](11_diagrammes_uml.md) | Description de l'ensemble des 11 diagrammes UML : classes, cas d'utilisation, séquences, composants, états, activités, déploiement, packages | 8–10 pages |

## Ordre de lecture recommandé

### Lecture rapide (vue d'ensemble)
1. `00_resume_executif.md` — Comprendre le projet en 5 minutes
2. `01_architecture_globale.md` — Saisir la structure technique
3. `03_pipeline_nlp.md` — Comprendre la valeur ajoutée IA

### Lecture technique complète
1. `00_resume_executif.md`
2. `01_architecture_globale.md`
3. `05_modele_donnees.md`
4. `02_fonctionnalites_par_role.md`
5. `03_pipeline_nlp.md`
6. `04_api_reference.md`
7. `07_securite.md`
8. `08_application_mobile.md`
9. `09_workflows_n8n.md`
10. `06_guide_installation.md`
11. `10_glossaire.md`
12. `11_diagrammes_uml.md`

### Pour un rapport académique
Suivre l'ordre numérique `00` → `10`. Chaque fichier correspond à un chapitre autonome.

---

## Informations sur la génération

- **Projet** : ATS RANDA — Applicant Tracking System avec matching sémantique
- **Stack principale** : FastAPI (Python 3.11) + PostgreSQL/pgvector + React 18 (TypeScript) + Flutter
- **NLP** : sentence-transformers `paraphrase-multilingual-MiniLM-L12-v2` (384 dimensions)
- **Infrastructure** : Docker Compose (10 services)
- **Documentation interactive** : http://localhost:8000/docs (Swagger UI)
