# Diagrammes UML — ATS RANDA

Documentation visuelle complète du système ATS RANDA sous forme de diagrammes Mermaid. Tous les diagrammes sont générés à partir du code source réel (`db_models.py`, `cv_tasks.py`, `scorer.py`, `router/index.tsx`, `router.dart`, `docker-compose.yml`).

## Index des diagrammes

| # | Fichier | Type UML | Description | Priorité lecture |
|---|---------|----------|-------------|:---------------:|
| 01 | [01_diagramme_classes.md](01_diagramme_classes.md) | Classes | Modèle de données : 12 tables, relations, pgvector, JSONB, énumérations | 1 |
| 02 | [02_diagramme_cas_utilisation.md](02_diagramme_cas_utilisation.md) | Cas d'utilisation | Fonctionnalités par rôle (5 acteurs + tableau RBAC) | 2 |
| 03 | [03_diagramme_sequence_authentification.md](03_diagramme_sequence_authentification.md) | Séquence | Connexion locale JWT, OAuth2 Google, validation token, expiration | 3 |
| 04 | [04_diagramme_sequence_matching.md](04_diagramme_sequence_matching.md) | Séquence | Pipeline NLP complet : import Keejob, embedding Celery, matching pgvector, décision RH | 4 |
| 05 | [05_diagramme_sequence_candidature.md](05_diagramme_sequence_candidature.md) | Séquence | Cycle de vie candidature : dépôt → analyse IA → timeline 4 étapes → entretien | 5 |
| 06 | [06_diagramme_composants.md](06_diagramme_composants.md) | Composants | Architecture distribuée : 11 services Docker, flux réseau, volumes | 6 |
| 07 | [07_diagramme_etats.md](07_diagramme_etats.md) | États | Machines à états : CV, candidature, offre, entretien, session utilisateur | 7 |
| 08 | [08_diagramme_activites.md](08_diagramme_activites.md) | Activités | Processus métier avec swimlanes : recrutement bout-en-bout, import, matching, entretiens | 8 |
| 09 | [09_diagramme_deploiement.md](09_diagramme_deploiement.md) | Déploiement | Infrastructure Docker Compose : nœuds, volumes, ports, commandes | 9 |
| 10 | [10_diagramme_sequence_mobile.md](10_diagramme_sequence_mobile.md) | Séquence | App Flutter RH : démarrage, restauration session, matching mobile, invalidation Riverpod | 10 |
| 11 | [11_diagramme_packages.md](11_diagramme_packages.md) | Packages | Organisation du code : backend Python, frontend React, mobile Flutter | 11 |

---

## Ordres de lecture recommandés

### Découverte rapide (30 minutes)
1. **01** — Comprendre les données
2. **02** — Comprendre les acteurs et leur périmètre
3. **06** — Comprendre l'infrastructure

### Compréhension technique complète (2 heures)
1. **01** → **06** → **11** — Données + Infrastructure + Organisation
2. **02** → **07** — Fonctionnalités + Cycles de vie
3. **03** → **04** → **05** — Flux d'authentification + NLP + Candidature
4. **08** → **09** → **10** — Processus + Déploiement + Mobile

### Pour un rapport académique
Suivre l'ordre numérique `01` → `11`. Chaque fichier est autonome.

---

## Comment visualiser les diagrammes Mermaid

### VS Code (recommandé)
Installer l'extension **"Markdown Preview Mermaid Support"** (Markdown Preview Enhanced).
Ouvrir le fichier `.md` → `Ctrl+Shift+V` pour la prévisualisation.

### En ligne
- **https://mermaid.live** — éditeur en ligne temps réel
- Coller le contenu d'un bloc ` ```mermaid ``` ` pour visualiser

### GitHub / GitLab
Les fichiers `.md` avec blocs Mermaid sont **rendus nativement** dans les interfaces web. Aucune configuration nécessaire.

### Génération d'images (CI/CD)
```bash
# Installer Mermaid CLI
npm install -g @mermaid-js/mermaid-cli

# Générer PNG depuis un fichier Markdown
mmdc -i docs/uml/01_diagramme_classes.md -o output/01_classes.png
```

---

## Cohérence des noms

Les noms de classes, tables, routes et champs sont identiques dans tous les diagrammes et correspondent exactement au code source :

| Concept | Nom exact dans le code |
|---------|----------------------|
| Table candidats | `candidates` (SQLAlchemy: `Candidate`) |
| Table résultats matching | `resultats` (SQLAlchemy: `Resultat`) |
| Table offres | `job_offers` (SQLAlchemy: `JobOffer`) |
| Table entretiens | `entretiens` (SQLAlchemy: `Entretien`) |
| État CV indexé | `INDEXED` (enum `CVStatus`) |
| Décision retenu | `RETAINED` (enum `Decision`) |
| Pondération sémantique | `poids_semantique` (défaut `0.40`) |
| Colonne vecteur | `embedding Vector(384)` |

> **Note** : Il n'existe pas de table `candidatures` dans le modèle. Les candidatures sont représentées par des enregistrements `Resultat` avec `decision=PENDING`.
