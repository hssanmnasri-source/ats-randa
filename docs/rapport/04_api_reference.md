# Référence API Complète

> Documentation interactive disponible sur **http://localhost:8000/docs** (Swagger UI) et **http://localhost:8000/redoc** (ReDoc).

Toutes les routes protégées requièrent un en-tête HTTP :
```
Authorization: Bearer <access_token>
```

---

## /api/visitor/* — Authentification et offres publiques

| Méthode | Chemin | Rôle requis | Description |
|---------|--------|-------------|-------------|
| `POST` | `/api/visitor/register` | Aucun | Créer un compte candidat |
| `POST` | `/api/visitor/login` | Aucun | Connexion et obtention du token JWT |
| `GET` | `/api/visitor/offers` | Aucun | Lister les offres actives (paginées, filtrées) |
| `GET` | `/api/visitor/offers/{offer_id}` | Aucun | Détail d'une offre publique |

### POST `/api/visitor/register`
```
Body:   { nom: str, prenom: str, email: str, password: str }
Retour: { access_token: str, token_type: "bearer" }
Code:   201
```

### POST `/api/visitor/login`
```
Body:   { email: str, password: str }
Retour: { access_token: str, token_type: "bearer" }
Code:   200
Erreur: 401 si identifiants incorrects
```

### GET `/api/visitor/offers`
```
Query:  search?: str, experience_min?: float, langue?: str,
        page: int=1, limit: int=20 (max 100)
Retour: { total: int, page: int, offres: [PublicOfferOut] }
```

### GET `/api/visitor/offers/{offer_id}`
```
Path:   offer_id: int
Retour: PublicOfferDetailOut (+ est_appliquee: bool si candidat connecté)
Erreur: 404 si offre inexistante ou inactive
```

---

## /api/auth/* — OAuth2 Google

| Méthode | Chemin | Rôle requis | Description |
|---------|--------|-------------|-------------|
| `GET` | `/api/auth/google/login` | Aucun | Redirection vers Google OAuth2 |
| `GET` | `/api/auth/google/callback` | Aucun | Callback Google — échange code → token JWT |

### GET `/api/auth/google/login`
```
Retour: Redirection HTTP 302 vers accounts.google.com
```

### GET `/api/auth/google/callback`
```
Query:  code: str (fourni par Google), state?: str
Retour: Redirection vers le frontend avec le token JWT en paramètre
Effets: Création du compte si email nouveau, liaison Google ID si email existant
```

---

## /api/candidate/* — Portail Candidat

Toutes les routes requièrent le rôle **CANDIDATE**.

### Profil

| Méthode | Chemin | Description |
|---------|--------|-------------|
| `GET` | `/api/candidate/profile` | Lire le profil complet |
| `PUT` | `/api/candidate/profile` | Mettre à jour le profil de base |
| `PUT` | `/api/candidate/profile/personal` | Mettre à jour les données personnelles |
| `PUT` | `/api/candidate/profile/professional` | Mettre à jour les données professionnelles |
| `PUT` | `/api/candidate/profile/visibility` | Modifier la visibilité et les alertes |
| `POST` | `/api/candidate/profile/photo` | Uploader une photo de profil |
| `GET` | `/api/candidate/profile/completion` | Score de complétion du profil (0-100) |
| `GET` | `/api/candidate/profile/full` | Profil complet avec expériences, compétences, formations |

### PUT `/api/candidate/profile/personal`
```
Body: {
  age?: int, code_postal?: str, ville?: str, region?: str,
  nationalite?: str, situation_familiale?: str,
  has_driving_license?: bool, owns_car?: bool, has_handicap?: bool,
  mobilite_tn?: bool, mobilite_intl?: bool
}
Retour: CandidateProfileOut
```

### PUT `/api/candidate/profile/professional`
```
Body: {
  titre_poste?: str, niveau_etude?: str, niveau_experience?: str,
  statut_pro?: str, secteurs_recherche?: list, metiers_recherche?: list
}
Retour: CandidateProfileOut
```

### PUT `/api/candidate/profile/visibility`
```
Body: {
  visibility_status: "VISIBLE" | "ANONYMOUS" | "INVISIBLE",
  alert_frequency: "DAILY" | "TWICE_WEEK" | "WEEKLY" | "NEVER"
}
Retour: CandidateProfileOut
```

### GET `/api/candidate/profile/full`
```
Retour: {
  profile: CandidateProfileOut,
  completion: { total: int, sections: {} },
  experiences: [ExperienceOut],
  skills: [SkillOut],
  langues: [{ langue: str, niveau: str }],
  formations: [{ diplome: str, etablissement: str, annee: str }]
}
```

### Expériences professionnelles

| Méthode | Chemin | Description |
|---------|--------|-------------|
| `GET` | `/api/candidate/profile/experiences` | Lister les expériences |
| `POST` | `/api/candidate/profile/experiences` | Ajouter une expérience |
| `DELETE` | `/api/candidate/profile/experiences/{exp_id}` | Supprimer une expérience |

### POST `/api/candidate/profile/experiences`
```
Body: {
  poste: str, entreprise: str, date_debut: str, date_fin?: str,
  type_contrat?: str, secteur_activite?: str, missions?: str, is_current?: bool
}
Retour: ExperienceOut
Code:   201
```

### Compétences

| Méthode | Chemin | Description |
|---------|--------|-------------|
| `GET` | `/api/candidate/profile/skills` | Lister les compétences |
| `POST` | `/api/candidate/profile/skills` | Ajouter une compétence |
| `DELETE` | `/api/candidate/profile/skills/{skill_id}` | Supprimer une compétence |

### CVs

| Méthode | Chemin | Description |
|---------|--------|-------------|
| `POST` | `/api/candidate/cvs/upload` | Uploader un CV (PDF/image, max 5 Mo) |
| `POST` | `/api/candidate/cvs/form` | Soumettre un CV structuré via formulaire |
| `GET` | `/api/candidate/cvs` | Lister ses CVs (paginés) |
| `GET` | `/api/candidate/cvs/{cv_id}` | Détail d'un CV |
| `PUT` | `/api/candidate/cvs/{cv_id}/validate` | Corriger/valider les entités extraites |

### POST `/api/candidate/cvs/form`
```
Body: {
  titre_poste: str,
  resume: str (≥50 caractères),
  experience_annees: int (0-50),
  niveau_etude: "BAC" | "BAC+2" | "BAC+3" | "BAC+5" | "Doctorat",
  competences: [str] (≥1 élément)
}
Retour: CVOut (statut: INDEXED)
Code:   201
```

### Candidatures

| Méthode | Chemin | Description |
|---------|--------|-------------|
| `POST` | `/api/candidate/offers/{offer_id}/apply` | Postuler à une offre |
| `GET` | `/api/candidate/applications` | Lister ses candidatures |
| `GET` | `/api/candidate/applications/{result_id}/detail` | Détail + timeline d'une candidature |
| `DELETE` | `/api/candidate/applications/{application_id}` | Retirer une candidature (si PENDING) |

### GET `/api/candidate/applications/{result_id}/detail`
```
Retour: {
  id, offre_id, offre_titre, date_candidature, decision,
  score_final, score_matching, score_skills, score_experience, score_langue,
  feedback_rh: str|null, feedback_visible: bool, date_decision: datetime|null,
  timeline: [{
    statut: "POSTULE"|"ANALYSE"|"EN_EXAMEN"|"DECISION",
    label: str, description: str, date: datetime|null,
    done: bool, active: bool, color: str
  }]
}
```

---

## /api/agent/* — Portail Agent

Toutes les routes requièrent le rôle **AGENT**.

| Méthode | Chemin | Description |
|---------|--------|-------------|
| `POST` | `/api/agent/cvs/upload` | Uploader un CV candidat (avec évaluation OCR) |
| `POST` | `/api/agent/cvs/batch` | Uploader jusqu'à 10 CVs en lot |
| `GET` | `/api/agent/cvs` | Lister les CVs importés par cet agent |
| `GET` | `/api/agent/cvs/{cv_id}` | Détail d'un CV (vérification propriété agent) |
| `POST` | `/api/agent/import/keejob` | Importer un PDF format Keejob (synchrone) |
| `GET` | `/api/agent/history` | Historique des imports avec bilan de matching |
| `GET` | `/api/agent/dashboard` | Tableau de bord agent |

### POST `/api/agent/cvs/upload`
```
Form: file (image/jpeg|image/png|application/pdf),
      nom: str, prenom: str,
      email?: str, telephone?: str, offer_id?: int
Retour: {
  cv_id, candidate_id, candidate_created: bool,
  statut: "UPLOADED", source: "AGENT",
  ocr_quality: {
    score: int (0-100), niveau: str, message: str,
    conseils: [str], nb_caracteres: int, nb_mots: int,
    a_email: bool, a_telephone: bool, a_sections: bool
  }
}
Code: 201
```

### POST `/api/agent/cvs/batch`
```
Form: files[]: List[UploadFile] (max 10), offer_id?: int
Retour: {
  total: int, reussis: int, erreurs: int,
  resultats: [{ fichier, statut: "OK"|"ERREUR", cv_id?, candidate_id?, message? }]
}
Code: 201
```

### POST `/api/agent/import/keejob`
```
Form: file (application/pdf, max 10 Mo)
Retour: {
  cv_id, candidate_id, candidate_created: bool,
  statut: "INDEXED", source: "AGENT",
  entities: { id_keejob, titre_poste, nom, prenom, age, email, telephone,
              ville, niveau_etude, experience_annees, situation_pro,
              disponibilite, permis_conduire, salaire_souhaite,
              nb_competences, nb_experiences, nb_formations, nb_langues, resume },
  message: str
}
Code: 201
```

---

## /api/rh/* — Portail RH

Toutes les routes requièrent le rôle **RH**.

### Offres d'emploi

| Méthode | Chemin | Description |
|---------|--------|-------------|
| `GET` | `/api/rh/offers` | Lister les offres (filtres : statut, page, limit) |
| `POST` | `/api/rh/offers` | Créer une offre (statut initial : BROUILLON) |
| `GET` | `/api/rh/offers/{id}` | Détail d'une offre |
| `PUT` | `/api/rh/offers/{id}` | Modifier une offre |
| `DELETE` | `/api/rh/offers/{id}` | Archiver une offre |
| `PATCH` | `/api/rh/offers/{id}/statut` | Transition de statut (machine à états) |
| `PUT` | `/api/rh/offers/{id}/poids` | Configurer les pondérations de scoring |
| `PUT` | `/api/rh/offers/{id}/seuil` | Configurer l'alerte seuil + matching auto |
| `POST` | `/api/rh/offers/{id}/reset-alerte` | Réinitialiser l'alerte |
| `GET` | `/api/rh/offers/{id}/stats` | Statistiques de l'offre (jours: 7-90) |
| `GET` | `/api/rh/offers/{id}/export/pdf` | Exporter les résultats de matching en PDF |

### POST `/api/rh/offers`
```
Body: {
  titre: str, description: str,
  competences_requises: [str],
  experience_requise: float,
  langue_requise: str,
  details?: {}
}
Retour: OfferOut (statut: "BROUILLON")
Code:   201
```

### PUT `/api/rh/offers/{id}/poids`
```
Body: {
  poids_semantique: float (0.0-1.0),
  poids_competences: float (0.0-1.0),
  poids_experience: float (0.0-1.0),
  poids_langue: float (0.0-1.0)
}
Contrainte: somme ≈ 1.0 (±5%)
Retour: { message: str, poids: { semantique, competences, experience, langue } }
```

### Matching

| Méthode | Chemin | Description |
|---------|--------|-------------|
| `POST` | `/api/rh/offers/{id}/matching` | Déclencher le matching (pgvector + scoring) |
| `GET` | `/api/rh/offers/{id}/matching` | Consulter les résultats (filtres avancés) |
| `PATCH` | `/api/rh/offers/{id}/matching/{result_id}` | Prendre une décision avec feedback |

### POST `/api/rh/offers/{id}/matching`
```
Query:  top_n: int=50 (max 200), force: bool=false
Retour: {
  offer_id, titre, total: int,
  resultats: [{
    id, cv_id, candidate_nom, candidate_email,
    score_matching, score_skills, score_experience, score_langue, score_final,
    rang, decision, feedback_rh, feedback_visible, date_decision
  }]
}
```

### GET `/api/rh/offers/{id}/matching`
```
Query:  decision?: "RETAINED"|"PENDING"|"REFUSED",
        score_min?: float (0.0-1.0),
        age_min?: int, age_max?: int,
        region?: str, ville?: str,
        niveau_etude?: str, niveau_experience?: str,
        disponibilite?: str, has_driving_license?: bool,
        skip: int=0, limit: int=50 (max 500)
Retour: { offer_id, titre, total, skip, limit, resultats: [...] }
```

### PATCH `/api/rh/offers/{id}/matching/{result_id}`
```
Body:   { decision: "RETAINED"|"REFUSED"|"PENDING",
          feedback_rh?: str, feedback_visible: bool }
Retour: { id, decision, rang, score_final,
          feedback_rh, feedback_visible, date_decision }
Note:   RETAINED et REFUSED sont immuables (ne peuvent pas être modifiés une fois posés)
```

### Tableau de bord et statistiques

| Méthode | Chemin | Description |
|---------|--------|-------------|
| `GET` | `/api/rh/me` | Identité du RH connecté |
| `GET` | `/api/rh/dashboard` | Vue d'ensemble (candidats, CVs, offres) |
| `GET` | `/api/rh/dashboard/stats` | Métriques détaillées pour le RH courant |
| `GET` | `/api/rh/cvs` | CVthèque globale |
| `GET` | `/api/rh/calendar` | Entretiens planifiés (FullCalendar) |

---

## /api/admin/* — Portail Administrateur

Toutes les routes requièrent le rôle **ADMIN**.

| Méthode | Chemin | Description |
|---------|--------|-------------|
| `GET` | `/api/admin/users` | Lister tous les utilisateurs |
| `POST` | `/api/admin/users` | Créer un utilisateur |
| `GET` | `/api/admin/users/{id}` | Détail d'un utilisateur |
| `PUT` | `/api/admin/users/{id}` | Modifier un utilisateur |
| `PATCH` | `/api/admin/users/{id}/toggle` | Activer / désactiver un compte |
| `GET` | `/api/admin/stats` | Statistiques globales du système |
| `GET` | `/api/admin/audit` | Journal d'audit des actions |
| `GET` | `/api/admin/system` | État de santé du système |

### GET `/api/admin/stats`
```
Retour: {
  users: { total, actifs, par_role: {}, nouveaux_7j },
  cvs: { total, indexes, erreurs, par_statut: {}, par_source: {}, nouveaux_7j, nouveaux_30j },
  offres: { total, actives, archivees },
  matching: { total_resultats, par_decision: {}, score_moyen },
  candidats: { total },
  top_rh: [{ id, nom, prenom, email, nb_offres, nb_candidatures }]
}
```

---

## /api/n8n/* — Webhooks et déclencheurs n8n

Les routes de déclenchement requièrent le rôle **RH**. Les webhooks sont sécurisés par le header `X-N8N-Secret`.

| Méthode | Chemin | Auth | Description |
|---------|--------|------|-------------|
| `POST` | `/api/n8n/declencher-generation` | RH | Générer les créneaux pour tous les candidats RETAINED |
| `POST` | `/api/n8n/envoyer-emails-backend` | RH | Envoyer les invitations d'entretien par email |
| `GET` | `/api/n8n/propositions` | RH | Récupérer les créneaux proposés (polling 5s) |
| `GET` | `/api/n8n/calendrier` | RH | Récupérer les entretiens confirmés (polling 10s) |
| `POST` | `/api/n8n/creneaux-generes` | X-N8N-Secret | Webhook : confirmer la génération de créneaux |
| `POST` | `/api/n8n/entretiens/emails-envoyes` | X-N8N-Secret | Webhook : confirmer l'envoi des emails |

### POST `/api/n8n/declencher-generation`
```
Body:   {} (vide ou paramètres optionnels)
Retour: {
  total_retained: int,
  creneaux_generes: [{ id_entretien, id_candidate, date_entretien, statut }]
}
Note:   Génère des créneaux pour tous les Resultats avec decision=RETAINED
        sans entretien PROPOSE ou CONFIRME existant
```

### POST `/api/n8n/envoyer-emails-backend`
```
Body:   {} 
Retour: { emails_envoyes: int, erreurs: int }
Note:   Envoie les invitations d'entretien via SMTP (mailer.py)
        Met à jour statut Entretien → ENVOYE
```

---

## Notes sur la documentation interactive

La documentation Swagger UI complète (avec possibilité de tester les routes directement) est accessible sur :
- **Swagger UI** : http://localhost:8000/docs
- **ReDoc** : http://localhost:8000/redoc
- **OpenAPI JSON** : http://localhost:8000/openapi.json

Le schéma OpenAPI est généré automatiquement par FastAPI à partir des annotations de type Pydantic et des signatures de fonctions.
