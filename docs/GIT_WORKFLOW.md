# Git Workflow — ATS RANDA (Hsan & Salma)

## Repo GitHub
```
https://github.com/hssanmnasri-source/ats-randa
```

---

## Structure des branches

```
main                    ← production stable (ne jamais pousser directement)
dev                     ← branche d'intégration commune (merge fréquent)
├── hsan/frontend-rh    ← Dashboard RH + Interface Agent + DevOps
└── salma/api-routes    ← Routes API manquantes + Tests + Admin
```

---

## Setup initial — HSAN

```bash
# Déjà fait — vérifier que la branche est à jour
git checkout main
git pull origin main

git checkout dev
git pull origin dev

git checkout hsan/frontend-rh
git pull origin hsan/frontend-rh
```

---

## Setup initial — SALMA

```bash
# 1. Cloner le repo
git clone https://github.com/hssanmnasri-source/ats-randa.git
cd ats-randa

# 2. Configurer son identité Git
git config user.name "Salma"
git config user.email "salma@email.com"

# 3. Récupérer la branche dev
git checkout dev
git pull origin dev

# 4. Créer sa branche de travail
git checkout -b salma/api-routes
git push -u origin salma/api-routes
```

---

## Workflow quotidien

### Commencer une session de travail

```bash
# Toujours synchroniser dev avant de travailler
git checkout dev
git pull origin dev

# Revenir sur sa branche et intégrer les dernières modifs de dev
git checkout hsan/frontend-rh        # ou salma/api-routes
git merge dev
```

### Sauvegarder son travail

```bash
# Voir les fichiers modifiés
git status

# Ajouter les fichiers (préférer les fichiers spécifiques plutôt que -A)
git add frontend/src/pages/Dashboard.tsx
git add frontend/src/components/CVCard.tsx

# Commit avec message clair
git commit -m "feat: add RH dashboard with CV stats charts"

# Pousser sur GitHub
git push origin hsan/frontend-rh
```

### Créer une Pull Request (PR)

```bash
# Sur GitHub → "Compare & pull request"
# Base : dev  ←  Compare : hsan/frontend-rh
# Titre clair : "feat: Dashboard RH avec stats et matching"
# Assigner l'autre personne pour review
```

---

## Convention des commits

```
feat:     nouvelle fonctionnalité
fix:      correction de bug
refactor: refactoring sans changement de comportement
docs:     documentation uniquement
style:    formatage, indentation
test:     ajout ou modification de tests
chore:    configuration, dépendances
```

### Exemples

```bash
git commit -m "feat: add matching results table with decision buttons"
git commit -m "fix: correct pagination in candidate list endpoint"
git commit -m "docs: update API_REFERENCE with matching routes"
git commit -m "refactor: extract CV card into reusable component"
```

---

## Répartition des tâches

### HSAN — `hsan/frontend-rh`

```bash
git checkout hsan/frontend-rh
```

| Tâche | Dossier |
|-------|---------|
| Dashboard RH (stats, graphiques) | `frontend/src/pages/rh/` |
| Page matching — liste CVs classés | `frontend/src/pages/rh/Matching.tsx` |
| Interface Agent (import CVs, candidats) | `frontend/src/pages/agent/` |
| Composants partagés (CVCard, ScoreBar...) | `frontend/src/components/` |
| DevOps — GitHub Actions CI/CD | `.github/workflows/` |
| Config Nginx prod | `nginx/` |

### SALMA — `salma/api-routes`

```bash
git checkout salma/api-routes
```

| Tâche | Fichier |
|-------|---------|
| Route profil candidat | `backend/app/api/routes/candidate/profile.py` |
| Route candidatures | `backend/app/api/routes/candidate/applications.py` |
| Routes Admin (audit, roles, filiales) | `backend/app/api/routes/admin/` |
| Tests unitaires repositories | `backend/tests/` |
| Tests endpoints FastAPI | `backend/tests/test_api/` |

---

## Merge dev → main (milestones)

À faire ensemble uniquement aux étapes clés :

```bash
# S'assurer que dev est stable et testé
git checkout dev
git pull origin dev

# Merger dans main
git checkout main
git merge dev
git push origin main

# Taguer la version
git tag v0.x.0 -m "milestone: matching engine complete"
git push origin --tags
```

---

## Résoudre un conflit

```bash
# Lors d'un merge, Git signale les conflits
git merge dev
# CONFLICT (content): Merge conflict in backend/app/main.py

# Ouvrir le fichier, chercher les marqueurs :
# <<<<<<< HEAD
# ton code
# =======
# code de l'autre
# >>>>>>> dev

# Après résolution manuelle :
git add backend/app/main.py
git commit -m "fix: resolve merge conflict in main.py"
```

---

## Commandes rapides

```bash
# Voir toutes les branches
git branch -a

# Voir les commits récents
git log --oneline --graph --all -10

# Annuler les modifications non commitées d'un fichier
git checkout -- <fichier>

# Voir les différences avant commit
git diff

# Mettre de côté des modifs temporairement
git stash
git stash pop

# Voir qui a modifié quelle ligne
git blame <fichier>
```

---

## Branches actives

| Branche | Propriétaire | Rôle |
|---------|-------------|------|
| `main` | Les deux | Production stable |
| `dev` | Les deux | Intégration |
| `hsan/frontend-rh` | Hsan | Frontend + DevOps |
| `salma/api-routes` | Salma | Backend routes + Tests |
