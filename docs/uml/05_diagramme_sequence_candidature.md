# Diagrammes de Séquence — Cycle de vie d'une candidature

## Description

Ces diagrammes tracent le parcours complet d'une candidature dans ATS RANDA, de la soumission par le candidat jusqu'à l'invitation à un entretien. Ils illustrent l'interaction entre le portail candidat (`/api/candidate/*`), le moteur NLP (Celery), le portail RH (`/api/rh/*`), le système n8n et le mailer SMTP. La "candidature" dans ATS RANDA est représentée par un enregistrement **Resultat** — il n'existe pas de table `candidatures` séparée dans le modèle de données.

---

## 1. Dépôt de candidature par le candidat

```mermaid
sequenceDiagram
    actor CAN as Candidat
    participant C as Client React
    participant API as FastAPI :8000\ncandidate/applications.py
    participant DB as PostgreSQL

    CAN->>C: Consulte offre et clique "Postuler"
    C->>API: POST /api/candidate/offers/{offer_id}/apply

    API->>DB: SELECT candidate WHERE email=current_user.email
    DB-->>API: Candidate {id}

    API->>DB: SELECT cvs WHERE id_candidate=? AND statut=INDEXED
    DB-->>API: CV indexé (ou liste vide)

    alt Aucun CV indexé
        API-->>C: HTTP 400\n{"detail": "Veuillez déposer un CV avant de postuler"}
        C-->>CAN: Message d'erreur
    else CV indexé disponible
        API->>DB: SELECT resultat WHERE id_cv=? AND id_offre=?
        DB-->>API: Resultat existant ou NULL

        alt Candidature déjà soumise
            API-->>C: HTTP 409\n{"detail": "Vous avez déjà postulé à cette offre"}
        else Nouvelle candidature
            API->>DB: INSERT INTO resultats\n{id_cv, id_offre, decision=PENDING,\nscore_matching=0, score_final=0}
            DB-->>API: Resultat {id: result_id}

            API->>DB: INSERT INTO audit_logs\n{action: "application_submitted",\nresource: "resultat", resource_id}

            API-->>C: HTTP 201\n{message: "Candidature enregistrée",\nresultat_id: result_id}
            C-->>CAN: "Candidature soumise avec succès"
        end
    end
```

---

## 2. Analyse IA et mise à jour du statut (si CV non encore indexé)

Ce flux se produit quand le candidat a uploadé un CV avant de postuler, mais que le traitement Celery n'est pas encore terminé au moment de la candidature.

```mermaid
sequenceDiagram
    participant CEL as Celery Worker\nprocess_cv_on_upload
    participant DB as PostgreSQL
    participant EMB as embedder.py
    participant SCO as scorer.py

    Note over CEL: La tâche s'exécute après\nl'upload du CV (asynchrone)

    CEL->>DB: UPDATE cvs SET statut=INDEXED, embedding=vector
    DB-->>CEL: OK

    CEL->>DB: SELECT * FROM job_offers WHERE statut=ACTIVE
    DB-->>CEL: [offre_1, offre_2, ...]

    loop Pour chaque offre active
        CEL->>SCO: compute_final_score(cv_entities, offer)
        SCO-->>CEL: {score_matching, score_skills,\nscore_experience, score_langue, score_final}

        CEL->>DB: SELECT resultat WHERE id_cv=? AND id_offre=?
        DB-->>CEL: Resultat existant (decision=PENDING) ou NULL

        alt Resultat PENDING existant (candidature déjà soumise)
            CEL->>DB: UPDATE resultats SET\nscore_matching=?, score_skills=?,\nscore_experience=?, score_langue=?,\nscore_final=?, last_score_updated_at=NOW()
            Note over CEL,DB: Les scores sont mis à jour\ndécision PENDING conservée
        else Nouveau résultat (candidature pas encore soumise)
            CEL->>DB: INSERT INTO resultats\n{id_cv, id_offre, scores, decision=PENDING}
        end
    end

    CEL->>DB: COMMIT
    Note over CEL: → Candidature désormais en étape "ANALYSE IA"
```

---

## 3. Consultation de la timeline par le candidat

La timeline 4 étapes est calculée dynamiquement à partir de l'état du Resultat.

```mermaid
sequenceDiagram
    actor CAN as Candidat
    participant C as Client React
    participant API as FastAPI :8000\ncandidate/applications.py
    participant DB as PostgreSQL

    CAN->>C: Clique sur une candidature\n(ApplicationsPage)
    C->>API: GET /api/candidate/applications

    API->>DB: SELECT resultats JOIN job_offers\nWHERE resultat.id_cv IN\n(SELECT id FROM cvs WHERE id_candidate=?)
    DB-->>API: [Resultat + JobOffer]
    API-->>C: Liste des candidatures avec scores

    CAN->>C: Clique "Voir détail" → Drawer Ant Design
    C->>API: GET /api/candidate/applications/{result_id}/detail

    API->>DB: SELECT resultat JOIN job_offers JOIN cvs\nWHERE resultat.id=result_id\nAND cvs.id_candidate=candidate.id
    DB-->>API: Resultat complet

    API->>API: Construction timeline dynamique :
    Note over API: Étape 1 - POSTULÉ :\n  → done=true (Resultat existe)\n  date = resultat.date_analyse

    Note over API: Étape 2 - ANALYSE IA :\n  → done = (cv.statut == INDEXED)\n  date = cv.updated_at si INDEXED

    Note over API: Étape 3 - EN EXAMEN :\n  → done = (resultat.last_score_updated_at > date_analyse)\n  (scores mis à jour = RH a consulté)

    Note over API: Étape 4 - DÉCISION :\n  → done = (decision != PENDING)\n  date = resultat.date_decision\n  active = (decision == PENDING)

    API-->>C: HTTP 200 {\n  id, offre_id, offre_titre,\n  score_final, score_matching, score_skills,\n  score_experience, score_langue,\n  decision, date_decision,\n  feedback_rh: null ou texte si feedback_visible=true,\n  timeline: [\n    {statut: POSTULE, label, done, date},\n    {statut: ANALYSE, label, done, date},\n    {statut: EN_EXAMEN, label, done, date},\n    {statut: DECISION, label, done, date}\n  ]\n}

    C-->>CAN: Affiche timeline + scores détaillés\n(feedback visible si feedback_visible=true)
```

---

## 4. Workflow n8n — Génération de créneaux d'entretien

```mermaid
sequenceDiagram
    actor RH as Responsable RH
    participant C as Client React\nN8NCalendarPage
    participant API as FastAPI :8000\nrh/n8n_webhook.py
    participant DB as PostgreSQL
    participant N8N as n8n :5678
    participant ML as mailer.py

    Note over C: Polling GET /api/n8n/propositions\ntoutes les 5 secondes

    RH->>C: Clique "Générer créneaux"
    C->>API: POST /api/n8n/declencher-generation\nAuthorization: Bearer <rh_token>

    API->>DB: SELECT resultats JOIN job_offers JOIN cvs\nWHERE decision=RETAINED\nAND NOT EXISTS (\n  SELECT 1 FROM entretiens\n  WHERE id_resultat=resultat.id\n  AND statut IN ('PROPOSE','CONFIRME')\n)
    DB-->>API: [Resultats RETAINED sans entretien]

    loop Pour chaque candidat RETAINED
        API->>DB: INSERT INTO entretiens {\n  id_resultat, id_offre, id_rh,\n  id_candidate_user,\n  date_entretien (créneau calculé),\n  statut=PROPOSE,\n  duree_minutes=30\n}
        DB-->>API: Entretien {id}
    end

    API-->>C: HTTP 200 {\n  total_retained: N,\n  creneaux_generes: [{id_entretien, date_entretien, statut}]\n}

    Note over C: Polling reçoit les nouveaux créneaux\nlors de la prochaine itération (5s)
    C-->>RH: Affiche créneaux sur le calendrier
```

---

## 5. Envoi d'invitation d'entretien par email

```mermaid
sequenceDiagram
    actor RH as Responsable RH
    participant C as Client React
    participant API as FastAPI :8000
    participant DB as PostgreSQL
    participant ML as mailer.py\n(SMTP Gmail)
    participant EMAIL as Boîte mail\ndu candidat

    Note over C: Polling GET /api/n8n/calendrier\ntoutes les 10 secondes

    RH->>C: Clique "Envoyer invitations"
    C->>API: POST /api/n8n/envoyer-emails-backend\nAuthorization: Bearer <rh_token>

    API->>DB: SELECT entretiens JOIN candidates JOIN job_offers\nWHERE statut=PROPOSE AND email_envoye=false
    DB-->>API: [Entretiens à traiter]

    loop Pour chaque entretien
        API->>ML: send_entretien_invitation(\n  candidat_email,\n  candidat_nom,\n  offre_titre,\n  date_entretien,\n  lieu / lien_visio\n)

        ML->>ML: Construire email HTML :\n- Logo RANDA embarqué (base64)\n- Détails de l'entretien\n- Instructions de confirmation

        ML->>EMAIL: SMTP TLS (Gmail :587)\nFrom: MAIL_FROM\nTo: candidat_email

        alt Email envoyé avec succès
            EMAIL-->>ML: SMTP 250 OK
            ML-->>API: True
            API->>DB: UPDATE entretiens SET\nstatut=ENVOYE,\nemail_envoye=true
        else Échec envoi
            ML-->>API: Exception SMTP
            Note over API: Comptabilisé dans erreurs
        end
    end

    API-->>C: HTTP 200\n{emails_envoyes: N, erreurs: M}
    C-->>RH: "N invitations envoyées"

    Note over EMAIL: === Côté candidat ===
    EMAIL-->>EMAIL: Candidat reçoit email\navec détails entretien

    Note over C: Polling /calendrier reçoit\nles entretiens ENVOYE\nupdatés automatiquement
```
