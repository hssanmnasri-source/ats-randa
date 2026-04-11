# Fonctionnalités Détaillées par Rôle

## 3.1 Visiteur (non authentifié)

### Accès et périmètre

Le visiteur accède au système sans token d'authentification. Son périmètre est limité à la consultation publique et à l'enregistrement de son compte.

### Fonctionnalités

#### Consultation des offres publiques

La page d'accueil (`HomePage`) liste toutes les offres d'emploi actives. Le visiteur peut :
- Parcourir les offres avec pagination (20 par page par défaut)
- Filtrer par texte libre (titre/description), niveau d'expérience minimum, et langue requise
- Consulter le détail d'une offre (`OfferDetailPage`)
- Cliquer sur "Postuler" — redirigé vers `/login` s'il n'est pas connecté

#### Inscription

```
POST /api/visitor/register
Body: { nom, prenom, email, password }
Réponse: { access_token, token_type: "bearer" }
```
Le compte est créé avec le rôle `CANDIDATE` par défaut. Un enregistrement `Candidate` associé est créé automatiquement.

#### Connexion locale

```
POST /api/visitor/login
Body: { email, password }
Réponse: { access_token, token_type: "bearer" }
```
Vérification bcrypt du mot de passe. Le token JWT est stocké dans Zustand (`authStore`) et persisté en `localStorage`.

#### OAuth2 Google

```
GET /api/auth/google/login   → Redirection vers accounts.google.com
GET /api/auth/google/callback → Échange du code → création/liaison compte → token JWT
```
Si l'email existe déjà avec `auth_provider="local"`, le compte est lié au Google ID. Si l'email est nouveau, un compte est créé avec `auth_provider="google"`.

### Page correspondante

| Page | Chemin |
|------|--------|
| `HomePage` | `/` |
| `OfferDetailPage` (public) | `/offres/:id` |
| `LoginPage` | `/login` |
| `RegisterPage` | `/register` |
| `GoogleCallbackPage` | `/auth/google/callback` |

---

## 3.2 Candidat

### Accès

Accessible via `/candidate/*` après authentification. Route protégée par `ProtectedRoute` vérifiant le rôle `CANDIDATE`. Le layout `CandidateLayout` inclut une barre latérale avec menu de navigation.

### Fonctionnalités

#### Gestion du profil

Le profil candidat est structuré en plusieurs sections indépendantes, chacune avec son propre endpoint de mise à jour :

| Section | Endpoint | Champs |
|---------|----------|--------|
| Profil de base | `PUT /api/candidate/profile` | nom, prénom, email, téléphone, adresse |
| Données personnelles | `PUT /api/candidate/profile/personal` | âge, code postal, ville, région, nationalité, situation familiale, permis, handicap |
| Données professionnelles | `PUT /api/candidate/profile/professional` | titre de poste, niveau d'étude, niveau d'expérience, statut pro, secteurs et métiers recherchés |
| Mobilité | inclus dans `personal` | mobilité Tunisie, mobilité internationale |
| Visibilité | `PUT /api/candidate/profile/visibility` | `VISIBLE / ANONYMOUS / INVISIBLE`, fréquence d'alerte |
| Photo de profil | `POST /api/candidate/profile/photo` | fichier JPG/PNG/GIF/WebP, max 2 Mo |

La page `ProfilePage` calcule et affiche un taux de complétion via `GET /api/candidate/profile/completion` (score 0–100 par section).

#### Expériences professionnelles

Depuis `ProfilePage`, le candidat peut ajouter, consulter et supprimer ses expériences :

```
GET    /api/candidate/profile/experiences
POST   /api/candidate/profile/experiences
DELETE /api/candidate/profile/experiences/{exp_id}
```

Champs : poste, entreprise, dates de début/fin, type de contrat (CDI/CDD/SIVP/Stage/Freelance/Alternance), secteur d'activité, missions, poste actuel.

#### Compétences

```
GET    /api/candidate/profile/skills
POST   /api/candidate/profile/skills
DELETE /api/candidate/profile/skills/{skill_id}
```

Chaque compétence a un niveau : `BEGINNER`, `INTERMEDIATE`, ou `EXPERT`.

#### Dépôt et consultation de CVs

La page `MyCVPage` permet deux modes de dépôt :

1. **Upload PDF** (`POST /api/candidate/cvs/upload`) : fichier PDF, DOCX, JPG ou PNG, max 5 Mo. Le CV est analysé en arrière-plan par Celery (`process_cv_on_upload`).

2. **Formulaire structuré** (`POST /api/candidate/cvs/form`) : titre de poste, résumé (min 50 caractères), années d'expérience (0–50), niveau d'étude, liste de compétences. Le statut passe directement à `INDEXED`.

Après upload, le candidat peut valider/corriger les entités extraites via `PUT /api/candidate/cvs/{cv_id}/validate`.

#### Soumission de candidatures

Depuis `OffresPage` ou `OffreDetailPage`, le candidat peut postuler à une offre :
```
POST /api/candidate/offers/{offer_id}/apply
```
Un enregistrement `Resultat` est créé avec `decision=PENDING`. Si le candidat n'a pas de CV indexé, une erreur 400 est retournée.

Le candidat peut retirer sa candidature tant que la décision est encore `PENDING` :
```
DELETE /api/candidate/applications/{application_id}
```

#### Suivi des candidatures — Timeline 4 étapes

La page `ApplicationsPage` liste toutes les candidatures. Un clic ouvre un Drawer (Ant Design) avec la timeline détaillée via :
```
GET /api/candidate/applications/{result_id}/detail
```

Les 4 étapes de la timeline :

| Étape | Libellé | Déclencheur |
|-------|---------|-------------|
| 1 | POSTULÉ | Soumission de la candidature |
| 2 | ANALYSE IA | CV indexé + score calculé |
| 3 | EN EXAMEN | CV examiné par le RH |
| 4 | DÉCISION | Décision prise (RETENU / REFUSÉ) |

Si `feedback_visible=true` dans le `Resultat`, le feedback texte du RH est affiché au candidat.

Les scores détaillés (sémantique, compétences, expérience, langue) sont également visibles.

#### Générateur de CV

La page `CVGeneratorPage` charge le profil complet via :
```
GET /api/candidate/profile/full
```
Ce endpoint retourne `{ profile, completion, experiences, skills, langues, formations }`. Les `formations` et `langues` sont extraites du champ JSONB `cv_entities` du CV le plus récent indexé.

Le composant `CVDocument.tsx` (React.forwardRef) génère un CV en style A4 avec les couleurs de la charte graphique. L'export PDF est déclenché par `react-to-print` (hook `useReactToPrint({ contentRef })`).

#### Favoris et consultation des offres

Les favoris sont stockés **uniquement en `localStorage`** sous la clé `ats_favorite_offers` (pas d'endpoint backend). Le hook `useFavorites()` gère les ajouts/suppressions.

La page `OffresPage` liste toutes les offres actives avec filtres. La page `FavoritesPage` filtre les offres sauvegardées localement.

### Pages correspondantes

| Page | Chemin |
|------|--------|
| `DashboardPage` | `/candidate/dashboard` |
| `ProfilePage` | `/candidate/profile` |
| `MyCVPage` | `/candidate/cv` |
| `CVGeneratorPage` | `/candidate/cv-generator` |
| `OffresPage` | `/candidate/offres` |
| `OffreDetailPage` | `/candidate/offres/:id` |
| `ApplicationsPage` | `/candidate/applications` |
| `CoverLettersPage` | `/candidate/cover-letters` |
| `DocumentsPage` | `/candidate/documents` |
| `FavoritesPage` | `/candidate/favorites` |
| `SettingsPage` | `/candidate/settings` |

---

## 3.3 Agent de saisie

### Accès

Accessible via `/agent/*` après authentification. Route protégée par `require_agent`. L'agent dispose d'un isolement strict : il ne peut voir que les CVs qu'il a lui-même importés, grâce au filtre `agent_id` appliqué dans tous les repositories concernés.

> **Règle critique** : sans le filtre `agent_id=agent.id`, les routes agent retourneraient l'intégralité des 4 000+ CVs Keejob, ce qui constituerait une fuite de données entre agents.

### Fonctionnalités

#### Upload de CV unitaire

```
POST /api/agent/cvs/upload
Form Data: file (PDF/image), nom, prenom, email?, telephone?, offer_id?
```

Après upload, le backend :
1. Crée un `Candidate` si l'email n'existe pas encore.
2. Crée un `CV` avec `source=AGENT` et `id_agent=agent.id`.
3. Déclenche la tâche Celery `process_cv_on_upload`.
4. Retourne immédiatement l'analyse de qualité OCR.

La réponse inclut un objet `ocr_quality` détaillé :

| Champ | Description |
|-------|-------------|
| `score` | Score 0–100 |
| `niveau` | `EXCELLENT` (≥80), `BON` (≥60), `MOYEN` (≥40), `FAIBLE` (<40) |
| `message` | Explication textuelle |
| `conseils` | Liste de recommandations pour améliorer la qualité |
| `nb_caracteres` | Nombre de caractères extraits |
| `nb_mots` | Nombre de mots |
| `a_email` | Booléen — email détecté |
| `a_telephone` | Booléen — téléphone détecté |
| `a_sections` | Booléen — sections CV détectées |

#### Import Keejob (format spécifique)

```
POST /api/agent/import/keejob
Files: file (PDF, max 10 Mo)
```

Le parser Keejob (`keejob_parser.py`) extrait 15+ entités structurées et retourne immédiatement dans la réponse (parsing synchrone, pas de file d'attente Celery). Le candidat et le CV sont créés avec `statut=INDEXED` et `source=AGENT`.

La réponse inclut le nombre de compétences, d'expériences, de formations et de langues extraits, ainsi que le résumé du profil.

#### Upload en batch

```
POST /api/agent/cvs/batch
Form Data: files[] (max 10 fichiers), offer_id?
```

Traite jusqu'à 10 fichiers simultanément. La réponse résume les succès et échecs :
```json
{
  "total": 10,
  "reussis": 9,
  "erreurs": 1,
  "resultats": [{ "fichier": "cv1.pdf", "statut": "OK", "cv_id": 42 }, ...]
}
```

#### Consultation des CVs importés

```
GET /api/agent/cvs
Query: statut?, search?, page, limit
```

Retourne uniquement les CVs importés par cet agent (filtre `source=AGENT AND id_agent=agent.id`). Les statuts possibles : `UPLOADED`, `PARSING`, `INDEXED`, `ERROR`.

#### Historique des imports

```
GET /api/agent/history
Query: page, limit
```

Pour chaque CV importé, retourne le bilan de matching : nombre d'offres matchées, meilleur score, décompte des décisions (RETENU / REFUSÉ / EN ATTENTE).

### Pages correspondantes

| Page | Chemin |
|------|--------|
| `DashboardPage` | `/agent/dashboard` |
| `UploadCVPage` | `/agent/upload` |
| `BatchUploadPage` | `/agent/batch` |
| `CVListPage` | `/agent/cvs` |
| `HistoryPage` | `/agent/history` |

---

## 3.4 Responsable RH

### Accès

Accessible via `/rh/*`. Route protégée par `require_rh`. Le RH dispose du périmètre le plus large côté métier recrutement.

### Fonctionnalités

#### Gestion complète des offres (CRUD)

```
GET    /api/rh/offers          Lister les offres (avec filtre statut, pagination)
POST   /api/rh/offers          Créer une offre (statut initial : BROUILLON)
GET    /api/rh/offers/{id}     Détail d'une offre
PUT    /api/rh/offers/{id}     Modifier une offre
DELETE /api/rh/offers/{id}     Archiver une offre (statut → ARCHIVED)
PATCH  /api/rh/offers/{id}/statut   Transition de statut (machine à états)
```

**Machine à états des offres** :

```
BROUILLON → EN_VALIDATION → (PROCHAINEMENT) → ACTIVE → DESACTIVEE → ARCHIVED
    ↓                                                                    ↑
ARCHIVEE ────────────────────────────────────────────────────────────────┘
REFUSEE → BROUILLON (correction possible)
EXPIREE → ARCHIVEE
```

#### Configuration des pondérations de scoring

```
PUT /api/rh/offers/{id}/poids
Body: { poids_semantique, poids_competences, poids_experience, poids_langue }
Contrainte: somme ≈ 1.0 (±5%)
```

Permet d'adapter le scoring à chaque offre : une offre technique peut privilégier les compétences (50 %), une offre managériale peut privilégier l'expérience (30 %).

#### Déclenchement du matching sémantique

```
POST /api/rh/offers/{id}/matching
Query: top_n=50, force=false
```

Étapes du processus :
1. Génération de l'embedding de l'offre si absent.
2. Requête pgvector : top 200 CVs par cosinus.
3. Scoring multi-critères pour chaque CV.
4. Stockage des `Resultats` (création ou mise à jour).
5. Retour du top N classés par `score_final`.

#### Consultation et filtrage des résultats

```
GET /api/rh/offers/{id}/matching
Query: decision?, score_min?, age_min?, age_max?, region?, ville?,
       niveau_etude?, niveau_experience?, disponibilite?, has_driving_license?,
       skip, limit
```

Les filtres avancés permettent une présélection affinée sans relancer le matching.

#### Prise de décision avec feedback

```
PATCH /api/rh/offers/{id}/matching/{result_id}
Body: { decision: "RETAINED"|"REFUSED"|"PENDING", feedback_rh?, feedback_visible }
```

Règle métier : une décision RETAINED ou REFUSED est **immuable** — la tâche Celery `process_cv_on_upload` ignore les résultats avec ces décisions lors des recalculs.

Si `feedback_visible=true`, le feedback est affiché dans la timeline candidat.

#### Export PDF des résultats

```
GET /api/rh/offers/{id}/export/pdf
```

Génère un PDF listant tous les candidats analysés (triés par rang), avec scores et décisions. Retourné comme pièce jointe.

#### Tableau de bord et statistiques

```
GET /api/rh/dashboard          Vue d'ensemble (candidats, CVs, offres)
GET /api/rh/dashboard/stats    Métriques détaillées (mes offres, candidatures, CVthèque)
GET /api/rh/offers/{id}/stats  Statistiques par offre (courbe temporelle, régions, niveaux)
```

#### CVthèque

```
GET /api/rh/cvs
```

Accès à la totalité des CVs indexés dans le système (toutes sources : KEEJOB, AGENT, CANDIDAT), avec recherche et filtres.

#### Calendrier des entretiens

Deux modules distincts :

1. **CalendarPage** (`/rh/calendar`) — calendrier manuel via `GET /api/rh/calendar`. Le RH planifie des entretiens directement via l'interface FullCalendar.

2. **N8NCalendarPage** (`/rh/n8n-calendar`) — calendrier piloté par n8n. La page effectue du polling :
   - `GET /api/n8n/propositions` toutes les **5 secondes** pour les créneaux proposés.
   - `GET /api/n8n/calendrier` toutes les **10 secondes** pour les entretiens confirmés.

#### Module n8n : automatisation des entretiens

```
POST /api/n8n/declencher-generation    Générer les créneaux pour tous les RETAINED
POST /api/n8n/envoyer-emails-backend   Envoyer les invitations par email
```

Le RH déclenche ces actions depuis `N8NCalendarPage`. La logique métier (génération de créneaux, envoi SMTP) réside **entièrement dans le backend Python** — n8n n'est qu'un déclencheur optionnel.

#### Alertes seuil

```
PUT /api/rh/offers/{id}/seuil
Body: { seuil: int, matching_auto: bool }
```

Déclenche une alerte (et optionnellement un matching automatique) quand le nombre de CVs correspondants dépasse le seuil configuré.

### Pages correspondantes

| Page | Chemin |
|------|--------|
| `DashboardPage` | `/rh/dashboard` |
| `OffersPage` | `/rh/offers` |
| `OfferFormPage` | `/rh/offers/new`, `/rh/offers/:id/edit` |
| `MatchingPage` | `/rh/offers/:id/matching` |
| `ResultsPage` | `/rh/offers/:id/results` |
| `CandidaturesPage` | `/rh/candidatures` |
| `CVthequePage` | `/rh/cvtheque` |
| `StatsPage` | `/rh/stats` |
| `CalendarPage` | `/rh/calendar` |
| `N8NCalendarPage` | `/rh/n8n-calendar` |

---

## 3.5 Administrateur

### Accès

Accessible via `/admin/*`. Route protégée par `require_admin`. L'administrateur a une vue transversale sur l'ensemble du système.

### Fonctionnalités

#### Gestion des utilisateurs et des rôles

```
GET    /api/admin/users              Lister tous les utilisateurs (filtres : rôle, is_active, page)
POST   /api/admin/users              Créer un utilisateur (avec rôle assigné)
GET    /api/admin/users/{id}         Détail d'un utilisateur
PUT    /api/admin/users/{id}         Modifier un utilisateur
PATCH  /api/admin/users/{id}/toggle  Activer / désactiver un compte
```

#### Statistiques globales

```
GET /api/admin/stats
```

Retourne un bilan complet :
- Utilisateurs : total, actifs, par rôle, nouveaux (7 jours).
- CVs : total, indexés, en erreur, par statut, par source, nouveaux (7 et 30 jours).
- Offres : total, actives, archivées.
- Matching : total résultats, par décision, score moyen.
- Top RH : les responsables les plus actifs (offres créées, candidatures traitées).

#### Logs d'audit

```
GET /api/admin/audit
```

Chaque action utilisateur (connexion, décision, upload, etc.) est enregistrée dans `audit_logs` avec : `user_id`, `action`, `resource`, `resource_id`, `details` (JSONB), `ip_address`, `created_at`.

#### Santé système

```
GET /api/admin/system
```

Vérifie l'état des services critiques : connexion PostgreSQL, connexion Redis, espace disque, statut Celery.

#### Gestion des filiates

Les filiates (entités juridiques) sont gérées via l'interface admin. Chaque utilisateur peut être rattaché à une filiate (`id_filiale` dans `users`).

### Pages correspondantes

| Page | Chemin |
|------|--------|
| `DashboardPage` | `/admin/dashboard` |
| `UsersPage` | `/admin/users` |
| `UserFormPage` | `/admin/users/new`, `/admin/users/:id/edit` |
| `AdminCVsPage` | `/admin/cvs` |
| `AuditPage` | `/admin/audit` |
| `SystemHealthPage` | `/admin/system` |
