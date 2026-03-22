# Frontend ATS RANDA — État Complet

_Dernière mise à jour : 2026-03-22_

## ✅ Pages Complétées et Testées (Playwright)

| Page | Route | Statut |
|------|-------|--------|
| LoginPage | `/login` | ✅ Validation, redirect par rôle, erreur FR |
| RegisterPage | `/register` | ✅ Inscription CANDIDATE, redirect /login |
| HomePage (public) | `/` | ✅ Liste offres, recherche, pagination, postuler avec gestion `cv_required` |
| OfferDetailPage | `/offers/:id` | ✅ Détail complet, postuler avec erreurs intelligentes |
| RH Dashboard | `/rh` | ✅ StatsCards, charts CVs/offres |
| RH Offers | `/rh/offers` | ✅ CRUD, badge statut, matching rapide |
| RH OfferForm | `/rh/offers/new` + `/rh/offers/:id/edit` | ✅ Création/édition |
| **RH Matching** | `/rh/matching` | ✅ **Nom + email candidat**, 4 scores, décision RETAINED/REFUSED/PENDING, confirmation popconfirm |
| RH Results | `/rh/results` | ✅ Même tableau + stats retenus/refusés/en attente |
| Candidate Dashboard | `/candidate` | ✅ Alert si pas de CV, offres récentes |
| **Candidate MyCVPage** | `/candidate/cv` | ✅ **Upload + Formulaire complet** (titre, résumé, exp, études, compétences, langues) → statut Indexé ✓ |
| **Candidate Applications** | `/candidate/applications` | ✅ **Décision correcte** (PENDING/RETAINED/REFUSED), retrait si PENDING + popconfirm |
| Candidate Profile | `/candidate/profile` | ✅ Édition profil |
| Agent Dashboard | `/agent` | ✅ Stats globales |
| **Agent Upload CV** | `/agent/upload` | ✅ **Formulaire complet** (prénom, nom, email, tel + fichier) |
| Agent CV List | `/agent/cvs` | ✅ Table avec source (KEEJOB/AGENT/CANDIDAT), statut, date, pagination |
| Admin Dashboard | `/admin` | ✅ Stats globales, charts par rôle / par statut CV |
| Admin Users | `/admin/users` | ✅ Toggle actif, filtre rôle, pagination |
| Admin UserForm | `/admin/users/new` | ✅ Création utilisateur (tous rôles) |

## 🧪 Résultats Tests Playwright (22/03/2026)

| Test | Description | Résultat |
|------|-------------|---------|
| TEST 1 | Page publique — offres, search | ✅ PASS |
| TEST 2 | Login admin → /admin | ✅ PASS |
| TEST 3 | Admin dashboard — stats, charts | ✅ PASS |
| TEST 4 | Login RH → /rh | ✅ PASS |
| TEST 5 | RH Results — stats retenus/en attente | ✅ PASS |
| TEST 6 | RH Matching — noms candidats, 4 scores | ✅ PASS |
| TEST 6b | RH Matching — bouton Retenir, popconfirm, badge Retenu | ✅ PASS |
| TEST 7 | Register + login nouveau candidat | ✅ PASS |
| TEST 8 | CV formulaire — création + statut Indexé | ✅ PASS |
| TEST 9 | Postuler depuis homepage | ✅ PASS |
| TEST 10 | Mes candidatures — affichage + retrait | ✅ PASS |
| TEST 11 | Agent upload CV (bug fix appliqué) | ✅ PASS |

## 📊 Routes API Testées

| Route | Résultat |
|-------|----------|
| `GET /api/admin/stats` | ✅ `{users, cvs, offres, candidatures, candidats}` |
| `GET /api/rh/offers/{id}/matching` | ✅ Résultats avec `candidat_nom`, `candidat_prenom`, `candidat_email` |
| `POST /api/rh/offers/{id}/matching` | ✅ Même format enrichi |
| `PATCH /api/rh/offers/{id}/matching/{result_id}/decision` | ✅ Décision mise à jour, badge correct |
| `GET /api/candidate/applications` | ✅ `{total, candidatures: [{decision, date_candidature, offre}]}` |
| `POST /api/candidate/offers/{id}/apply` | ✅ Retourne `cv_required` si pas de CV |
| `DELETE /api/candidate/applications/{id}` | ✅ Retrait candidature |
| `GET /api/visitor/offers` | ✅ Liste publique paginée |
| `POST /api/candidate/cvs/form` | ✅ Création CV via formulaire, statut INDEXED immédiat |
| `POST /api/agent/cvs/upload` | ✅ Upload avec nom+prenom+file (multipart) |

## 🔧 Bugs Corrigés Cette Session

### Agent Upload CV — champs manquants (422 Unprocessable Entity)
- **Problème** : `CVUploadForm` n'envoyait que le fichier, sans `nom` ni `prenom` requis par l'API
- **Fix** :
  - `CVUploadForm.tsx` → ajout champs Prénom (requis), Nom (requis), Email, Téléphone + bouton Submit
  - `cvService.ts` → `agentUploadCV()` accepte `{file, nom, prenom, email?, telephone?}` et les append au FormData
  - `useCVs.ts` → type du mutation mis à jour
  - `UploadCVPage.tsx` → passe le payload complet

### Backend (sessions précédentes)
- `result_repository.list_by_offer()` → JOIN cvs + candidates (enrichit chaque résultat avec nom/email)
- `matching.py GET` route → utilise dicts enrichis directement
- `matching_service.run_matching()` → corrigé pour ne plus appeler `_row_to_dict` sur les dicts

### Frontend (sessions précédentes)
- `types/matching.ts` → `ResultatOut` avec `candidat_nom/prenom/email/telephone`
- `MatchResultTable` → colonne "CV #N" → **nom + email** du candidat
- `MyCVPage` → formulaire complet en mode `form`
- `candidateService.ts` → `ApplicationOut` corrigé (`decision`, `date_candidature`, `offre.titre`)
- `ApplicationsPage` → utilise les bons champs
- `matchingService.runMatching()` → retourne `MatchingResultsOut`
- `useRunMatching` → seed le cache avec les résultats du POST
- `OfferDetailPage` + `HomePage` → gestion intelligente erreur `cv_required`

## 🐛 Bugs Connus / Non-bloquants

- `'message' is deprecated` (antd static API) — fonctionne parfaitement, migration future vers `App.useApp().message`
- `'filterOption' is deprecated` dans Select antd — fonctionnel
- Bundle size > 500kB — normal pour une app avec antd + recharts

## 📊 État Base de Données (22/03/2026)

- **4,135 CVs** total (4,131 KEEJOB indexés + 3 CANDIDAT + 1 AGENT)
- **12 utilisateurs** (1 ADMIN, 1 RH, 4 AGENTS, 6 CANDIDATES)
- **2 offres** actives
- **102 candidatures** (101 en attente, 1 retenu)

## 🚀 Prochaines Étapes Recommandées

1. **Export CSV** dans MatchingPage / ResultsPage
2. **Notifications temps réel** — polling ou WebSocket pour alerter le candidat quand sa candidature change de statut
3. **MyCVPage** — afficher les compétences en Tags Ant Design au lieu du JSON brut `cv_entities`
4. **npm run build** — vérification TypeScript finale
