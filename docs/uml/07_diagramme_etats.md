# Diagrammes d'États — Cycles de vie des entités ATS RANDA

## Description

Ces diagrammes représentent les machines à états de chaque entité principale du système, dérivées des énumérations définies dans `backend/app/models/db_models.py` (CVStatus, OfferStatus, Decision, SkillLevel), de la logique métier dans les services et routes FastAPI, et du comportement des tâches Celery dans `cv_tasks.py`. Chaque transition indique son déclencheur (action utilisateur, tâche automatique ou événement système).

---

## 1. États d'un CV (`cvs.statut`)

Les états d'un CV suivent le cycle de traitement NLP, depuis l'upload brut jusqu'à l'indexation complète avec embedding 384-dim.

```mermaid
stateDiagram-v2
    [*] --> UPLOADED : Upload fichier\n(POST /api/candidate/cvs/upload\nou /api/agent/cvs/upload\nou /api/agent/import/keejob)

    UPLOADED --> PARSING : Celery task démarrée\nprocess_cv_on_upload(cv_id)

    PARSING --> INDEXED : Succès pipeline NLP :\n1. Texte extrait (OCR/pdfplumber)\n2. Entités parsées (keejob_parser / generic_parser)\n3. Embedding Vector(384) généré\n4. cv_version incrémenté

    PARSING --> ERROR : Échec irrémédiable :\n- PDF corrompu\n- Texte trop court / vide\n- Erreur Tesseract\n- Exception non récupérée\n(après max_retries=3)

    INDEXED --> INDEXED : Re-embedding déclenché :\n- PUT /api/candidate/cvs/:id/validate\n- Modification entités par le candidat\n(cv_version incrémenté à chaque fois)

    ERROR --> UPLOADED : Import manuel corrigé\nou re-soumission candidat

    note right of UPLOADED
        Stockage initial\nFichier dans /app/uploads/cvs/\nStatut par défaut de INSERT
    end note

    note right of INDEXED
        embedding ≠ NULL\nStatut cible = CVs participent\nau matching pgvector
    end note

    note right of ERROR
        Uniquement les CVs\nnon-ERROR et non-NULL\nembedding participent\nau matching
    end note
```

### Description des transitions CV

| De | Vers | Déclencheur | Acteur |
|----|------|-------------|--------|
| `[*]` | `UPLOADED` | Upload d'un fichier via POST API | Candidat ou Agent |
| `UPLOADED` | `PARSING` | Dépôt tâche dans Redis + démarrage Celery | Système (automatique) |
| `PARSING` | `INDEXED` | OCR + parsing + encode() réussis | Celery Worker |
| `PARSING` | `ERROR` | Exception après 3 tentatives | Celery Worker |
| `INDEXED` | `INDEXED` | Modification/validation des entités | Candidat (self-transition) |
| `ERROR` | `UPLOADED` | Réimport ou correction manuelle | Agent / Admin |

---

## 2. États d'une candidature / Resultat (`resultats.decision` + timeline)

Un Resultat représente à la fois le score de matching et la candidature. La timeline 4 étapes est dérivée dynamiquement de l'état du Resultat et du CV associé.

```mermaid
stateDiagram-v2
    [*] --> POSTULE : POST /api/candidate/offers/:id/apply\nOU création automatique par Celery\n→ INSERT resultats {decision=PENDING}

    POSTULE --> ANALYSE_IA : Celery process_cv_on_upload terminé\nScores calculés et stockés\n(cv.statut=INDEXED)

    ANALYSE_IA --> EN_EXAMEN : RH consulte les résultats\nGET /api/rh/offers/:id/matching\n(last_score_updated_at mis à jour)

    EN_EXAMEN --> DECISION_RETENU : PATCH matching/:id\n{decision: "RETAINED"}\nfeedback_rh + feedback_visible

    EN_EXAMEN --> DECISION_REFUSE : PATCH matching/:id\n{decision: "REFUSED"}\nfeedback_rh + feedback_visible

    DECISION_RETENU --> [*] : Fin du processus\n→ Workflow entretien n8n déclenché\n(si matching_auto ou action RH)

    DECISION_REFUSE --> [*] : Fin du processus\n(email de notification si activé)

    POSTULE --> RETIRE : DELETE /api/candidate/applications/:id\n(uniquement si decision=PENDING)

    RETIRE --> [*] : Candidature supprimée

    note right of POSTULE
        Étape 1 de la timeline candidat
        decision = PENDING
        scores peuvent être 0
    end note

    note right of ANALYSE_IA
        Étape 2 de la timeline candidat
        score_final calculé par scorer.py
        Jaccard + cosinus + expérience + langue
    end note

    note right of EN_EXAMEN
        Étape 3 de la timeline candidat
        RH voit les scores dans MatchingPage
        feedback_visible encore false
    end note

    note right of DECISION_RETENU
        Étape 4 — DÉCISION FINALE
        Immuable — ne peut plus être\nmodifié par process_cv_on_upload
        feedback_visible peut être true
    end note
```

---

## 3. États d'une offre d'emploi (`job_offers.statut`)

Machine à états complexe avec 9 états possibles et des transitions strictement contrôlées par `PATCH /api/rh/offers/:id/statut`.

```mermaid
stateDiagram-v2
    [*] --> BROUILLON : POST /api/rh/offers\nCréation par RH\n(par défaut)

    BROUILLON --> EN_VALIDATION : RH soumet pour validation
    BROUILLON --> ARCHIVED : RH archive directement

    EN_VALIDATION --> BROUILLON : Refus → retour en brouillon
    EN_VALIDATION --> PROCHAINEMENT : Planification publication future
    EN_VALIDATION --> ACTIVE : Validation → publication immédiate
    EN_VALIDATION --> ARCHIVED : Archivage depuis validation

    PROCHAINEMENT --> ACTIVE : Date de mise en ligne atteinte\nou publication manuelle
    PROCHAINEMENT --> DESACTIVEE : Désactivation avant publication
    PROCHAINEMENT --> ARCHIVED : Archivage

    ACTIVE --> DESACTIVEE : RH désactive temporairement
    ACTIVE --> ARCHIVED : RH archive (DELETE /api/rh/offers/:id)

    DESACTIVEE --> ACTIVE : RH réactive l'offre
    DESACTIVEE --> ARCHIVED : RH archive définitivement

    INACTIVE --> ACTIVE : Réactivation
    INACTIVE --> ARCHIVED : Archivage

    EXPIREE --> ARCHIVED : date_expiration dépassée\n→ transition automatique

    REFUSEE --> BROUILLON : Correction possible\npar le RH

    ARCHIVED --> [*] : État terminal\nne peut plus être modifié

    note right of ACTIVE
        Visible sur GET /api/visitor/offers\nParticipe au matching pgvector\nCVs uploadés matchés automatiquement
    end note

    note right of BROUILLON
        Non visible publiquement\nEmbedding généré en arrière-plan
    end note

    note right of ARCHIVED
        État terminal irréversible\nResultats et entretiens conservés
    end note
```

---

## 4. États d'un entretien — Workflow n8n (`entretiens.statut`)

```mermaid
stateDiagram-v2
    [*] --> PLANIFIE : Création manuelle par RH\nvia CalendarPage\n(POST /api/rh/calendar)

    [*] --> PROPOSE : Génération automatique n8n\nPOST /api/n8n/declencher-generation\n(decision=RETAINED)

    PLANIFIE --> CONFIRME : Confirmation manuelle RH\nou confirmation candidat
    PLANIFIE --> ANNULE : Annulation RH ou candidat

    PROPOSE --> CONFIRME : Candidat confirme sa présence\n(via email ou interface)
    PROPOSE --> ANNULE : Candidat décline\nou RH annule

    CONFIRME --> ENVOYE : POST /api/n8n/envoyer-emails-backend\n→ mailer.py SMTP\n→ email_envoye=true

    ENVOYE --> ANNULE : Annulation tardive

    ANNULE --> [*] : État final

    note right of PLANIFIE
        Créé via CalendarPage\n(FullCalendar, date manuelle)
    end note

    note right of PROPOSE
        Créé par le workflow n8n\nautomatiquement pour tous\nles candidats RETAINED
    end note

    note right of ENVOYE
        email_envoye = true\nCandidature considérée\nconclue côté processus
    end note
```

---

## 5. États de la session utilisateur

```mermaid
stateDiagram-v2
    [*] --> ANONYME : Première visite\n(pas de token)

    ANONYME --> AUTHENTIFIE : POST /api/visitor/login → JWT\nOU GET /api/auth/google/callback → JWT\nStockage : Zustand+localStorage (web)\nou flutter_secure_storage (mobile)

    AUTHENTIFIE --> AUTHENTIFIE : Chaque requête API\n(intercepteur Axios / Dio ajoute\nAuthorization: Bearer <token>)

    AUTHENTIFIE --> EXPIRE : Token JWT expiré\n(ACCESS_TOKEN_EXPIRE_MINUTES = 60 min)

    EXPIRE --> ANONYME : Intercepteur 401 :\n→ authStore.logout() (web)\n→ authStateProvider.logout() (mobile)\n→ Redirection /login

    AUTHENTIFIE --> ANONYME : Déconnexion volontaire\n(bouton logout)\nSuppression token local\n(côté client uniquement)

    ANONYME --> [*] : Fermeture navigateur/app\n(token persisté en localStorage\nou flutter_secure_storage)

    note right of AUTHENTIFIE
        Payload JWT : {sub: user_id,\nrole: RH/CANDIDATE/...,\ntype: "access", exp: timestamp}
        Algorithme: HS256
        Durée: 60 minutes
    end note

    note right of EXPIRE
        Le serveur ne stocke pas\nles tokens — validation\nstateless par signature
        Un refresh_token 7j peut\nrenouveler la session
    end note
```
