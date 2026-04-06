# Git Guide — ATS RANDA

## Setup initial (une seule fois)

```bash
git config --global user.name "Ton Nom"
git config --global user.email "ton@email.com"
```

---

## Workflow quotidien

### 1. Toujours partir d'un état à jour
```bash
git pull origin main
```

### 2. Voir ce qui a changé
```bash
git status                  # fichiers modifiés/ajoutés/supprimés
git diff                    # voir le contenu des changements
git diff --staged           # voir ce qui est déjà stagé
```

### 3. Stager les fichiers
```bash
git add nom_du_fichier.py           # un seul fichier
git add backend/app/services/       # tout un dossier
git add -u                          # tous les fichiers déjà trackés (modifiés/supprimés)
```

> ⚠️ Ne jamais faire `git add .` — risque d'ajouter `.env`, `node_modules`, etc.

### 4. Commiter
```bash
git commit -m "type: description courte"
```

**Types de commit :**
| Type | Quand |
|------|-------|
| `feat` | nouvelle fonctionnalité |
| `fix` | correction de bug |
| `chore` | nettoyage, config, sans impact fonctionnel |
| `docs` | documentation uniquement |
| `refactor` | refactoring sans nouveau comportement |
| `test` | ajout/modification de tests |

**Exemples :**
```bash
git commit -m "feat(rh): ajouter filtre par statut dans CVthèque"
git commit -m "fix: corriger erreur 422 sur upload CV agent"
git commit -m "docs: mettre à jour API_REFERENCE.md"
```

### 5. Pousser
```bash
git push origin main                # push normal
git push origin main --force        # force push (après reset --hard)
```

---

## Branches

```bash
git branch                          # lister les branches locales
git branch -a                       # toutes (locales + distantes)
git branch ma-branche               # créer une branche
git checkout ma-branche             # basculer dessus
git checkout -b ma-branche          # créer + basculer en une commande
git push origin ma-branche          # pousser la branche sur GitHub
```

**Branches du projet :**
| Branche | Rôle |
|---------|------|
| `main` | branche principale — toujours stable |
| `hsan/frontend-rh` | frontend Hsan |
| `salma/api-routes` | backend Salma |
| `dev` | intégration |

---

## Revenir en arrière

```bash
# Annuler les modifications non-stagées d'un fichier
git restore nom_fichier.py

# Désindexer un fichier stagé (sans perdre les modifs)
git restore --staged nom_fichier.py

# Revenir au dernier commit (ATTENTION : perd les changements non-commités)
git reset --hard HEAD

# Revenir à un commit précis (ATTENTION : réécrit l'historique)
git reset --hard <hash_commit>
git push origin main --force        # nécessaire après reset --hard
```

---

## Sauvegarder avant une opération risquée

```bash
# Créer une branche de sauvegarde avant tout reset
git branch backup/avant-modif-$(date +%Y%m%d)

# Mettre de côté les changements en cours (sans commiter)
git stash
git stash pop                       # récupérer après
```

---

## Historique

```bash
git log --oneline -10               # 10 derniers commits (compact)
git log --oneline --graph --all     # graphe de toutes les branches
git show <hash>                     # voir le contenu d'un commit
git diff main..ma-branche           # différences entre deux branches
```

---

## Commandes utiles

```bash
# Voir le hash du commit actuel
git rev-parse --short HEAD

# Voir quel commit est sur GitHub
git log origin/main --oneline -3

# Synchroniser sans merger (voir seulement ce qui a changé)
git fetch origin

# Annuler le dernier commit (garde les fichiers modifiés)
git reset --soft HEAD~1

# Voir qui a modifié une ligne
git blame backend/app/main.py
```

---

## Problèmes fréquents

### "Your branch is behind origin/main"
```bash
git pull origin main
```

### "Updates were rejected" au push
```bash
git pull origin main --rebase
git push origin main
```

### Fichier sensible accidentellement ajouté
```bash
git restore --staged .env           # désindexer
# Vérifier que .env est dans .gitignore
echo ".env" >> .gitignore
```

### Désindexer un dossier déjà tracké (ex: node_modules)
```bash
git rm --cached -r node_modules/
git commit -m "chore: untrack node_modules"
```
