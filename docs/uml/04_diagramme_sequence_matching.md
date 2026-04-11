# Diagrammes de Séquence — Pipeline NLP et Matching

## Description

Ces diagrammes décrivent le pipeline NLP complet d'ATS RANDA, depuis l'import d'un CV jusqu'à la prise de décision RH. Ils sont basés sur le code réel de `backend/app/tasks/cv_tasks.py` (tâche `process_cv_on_upload`), `backend/app/nlp/embedder.py`, `backend/app/nlp/scorer.py`, `backend/app/api/routes/rh/matching.py` et `backend/app/tasks/offer_tasks.py`.

---

## 1. Import et parsing d'un CV Keejob (synchrone)

L'import Keejob est le seul flux de parsing **synchrone** dans le système — le parser régex s'exécute dans la requête HTTP, pas dans Celery.

```mermaid
sequenceDiagram
    actor AGT as Agent
    participant C as Client React
    participant API as FastAPI :8000
    participant KP as keejob_parser.py
    participant DB as PostgreSQL

    AGT->>C: Sélectionne PDF Keejob
    C->>API: POST /api/agent/import/keejob\n(multipart/form-data: file.pdf)

    API->>API: Validation taille ≤ 10 Mo
    API->>API: extract_text_from_pdf(bytes)\n(pdfplumber ou Tesseract OCR)

    API->>KP: parse_keejob_cv(cv_text)
    KP->>KP: Extraction regex :\n- id_keejob, titre_poste, nom, prenom\n- age, email, telephone, ville\n- niveau_etude (normalisé: BAC/BAC+2/...)\n- experience_annees, situation_pro\n- competences[], experiences[]\n- formations[], langues[]
    KP-->>API: cv_entities (15+ champs)

    API->>DB: SELECT candidate WHERE email=cv_entities.email
    DB-->>API: Candidate ou NULL

    alt Candidat inexistant
        API->>DB: INSERT INTO candidates\n{nom, prenom, email, telephone, ville, ...}
        DB-->>API: Candidate (candidate_created=true)
    end

    API->>DB: INSERT INTO cvs\n{id_candidate, id_agent, source=AGENT,\nstatut=INDEXED, cv_entities, cv_text}
    DB-->>API: CV créé (cv_id)

    API->>DB: INSERT INTO competences (batch)\n(depuis cv_entities.competences)
    API->>DB: INSERT INTO experiences (batch)\n(depuis cv_entities.experiences)

    API-->>C: HTTP 201\n{cv_id, candidate_id, candidate_created,\nstatut: INDEXED, entities: {...},\nnb_competences, nb_experiences, nb_formations}
    C-->>AGT: Affiche résultat du parsing
```

---

## 2. Upload CV candidat + traitement asynchrone Celery

Pour les CVs déposés par un candidat ou importés par un agent (hors Keejob), le traitement NLP est délégué à la tâche Celery `process_cv_on_upload`.

```mermaid
sequenceDiagram
    actor CAN as Candidat
    participant C as Client React
    participant API as FastAPI :8000
    participant DB as PostgreSQL
    participant RDS as Redis (Broker)
    participant CEL as Celery Worker\nprocess_cv_on_upload
    participant OCR as ocr.py\n(Tesseract)
    participant PAR as generic_parser.py
    participant EMB as embedder.py\nparaphrase-multilingual-MiniLM-L12-v2
    participant SCO as scorer.py

    CAN->>C: Sélectionne fichier PDF/image
    C->>API: POST /api/candidate/cvs/upload\n(multipart/form-data: file)

    API->>API: Sauvegarde fichier\n→ /app/uploads/cvs/
    API->>DB: INSERT INTO cvs\n{id_candidate, source=CANDIDAT,\nstatut=UPLOADED, fichier_pdf}
    DB-->>API: CV {id: cv_id}

    API->>RDS: celery.apply_async(\n"tasks.process_cv_on_upload",\nargs=[cv_id])
    RDS-->>API: task_id (acknowledged)

    API-->>C: HTTP 201 {cv_id, statut: UPLOADED}
    C-->>CAN: "CV déposé — analyse en cours..."

    Note over CEL,SCO: === Traitement asynchrone dans Celery Worker ===

    RDS->>CEL: Consomme tâche process_cv_on_upload(cv_id)

    CEL->>DB: SELECT cv JOIN competences JOIN experiences\nWHERE cv.id=cv_id
    DB-->>CEL: CV object

    CEL->>OCR: extract_text_from_pdf(bytes)\n(pdfplumber si numérique\nou Tesseract fra+eng+ara si scanné)
    OCR-->>CEL: cv_text (texte brut)

    CEL->>PAR: parse_generic_cv(cv_text)
    PAR-->>CEL: cv_entities {competences, experiences, formations, langues, ...}

    CEL->>DB: UPDATE cvs SET cv_text=?, cv_entities=?

    CEL->>EMB: cv_to_embed_text(cv_entities, cv_text)\n→ "titre | Compétences: X,Y,Z | poste chez entrep..."
    EMB->>EMB: _get_model().encode(text,\nnormalize_embeddings=True)\n(synchrone CPU-bound, ~20-50ms)
    EMB-->>CEL: embedding [float×384] normalisé

    CEL->>DB: UPDATE cvs SET\nembedding=vector, statut=INDEXED,\ncv_version=cv_version+1

    Note over CEL,SCO: === Matching automatique contre toutes les offres ACTIVE ===

    CEL->>DB: SELECT * FROM job_offers\nWHERE statut=ACTIVE
    DB-->>CEL: active_offers[]

    loop Pour chaque offre active
        CEL->>CEL: cosine_sim = dot(cv_embedding, offer_embedding)\n(embeddings normalisés → dot = cosinus)
        CEL->>SCO: compute_final_score(\ncosine_sim, cv_entities,\noffer.competences_requises,\noffer.experience_requise,\noffer.langue_requise)
        SCO-->>CEL: {score_matching, score_skills,\nscore_experience, score_langue, score_final}

        CEL->>DB: SELECT resultat WHERE id_cv=? AND id_offre=?
        DB-->>CEL: Resultat ou NULL

        alt Resultat existant RETAINED ou REFUSED
            Note over CEL: SKIP — décision RH immuable
        else Resultat existant PENDING
            CEL->>DB: UPDATE resultats SET scores, last_score_updated_at
        else Pas de Resultat
            CEL->>DB: INSERT INTO resultats\n{id_cv, id_offre, scores, decision=PENDING}
        end
    end

    CEL->>DB: COMMIT
    CEL-->>RDS: Task result {status: ok, cv_id, cv_version,\ncreated: N, updated: M, skipped: K}
```

---

## 3. Création d'une offre et génération d'embedding

```mermaid
sequenceDiagram
    actor RH as Responsable RH
    participant C as Client React
    participant API as FastAPI :8000
    participant DB as PostgreSQL
    participant RDS as Redis
    participant CEL as Celery Worker\nembed_offer
    participant EMB as embedder.py

    RH->>C: Remplit formulaire nouvelle offre
    C->>API: POST /api/rh/offers\n{titre, description, competences_requises,\nexperience_requise, langue_requise, details}

    API->>DB: INSERT INTO job_offers\n{..., statut=BROUILLON, embedding=NULL}
    DB-->>API: JobOffer {id: offer_id}

    API->>RDS: celery.apply_async(\n"tasks.embed_offer", args=[offer_id])
    RDS-->>API: task_id

    API-->>C: HTTP 201 {offer_id, statut: BROUILLON}
    C-->>RH: Offre créée (embedding en cours)

    Note over CEL,EMB: === Tâche Celery embed_offer ===
    RDS->>CEL: Consomme embed_offer(offer_id)
    CEL->>DB: SELECT * FROM job_offers WHERE id=offer_id
    DB-->>CEL: JobOffer

    CEL->>EMB: offer_to_embed_text(offer)\n→ "titre | description[:500] | Compétences requises: X,Y"
    EMB->>EMB: _get_model().encode(text, normalize_embeddings=True)
    EMB-->>CEL: embedding [float×384]

    CEL->>DB: UPDATE job_offers\nSET embedding=vector WHERE id=offer_id
    CEL-->>RDS: Task result {status: ok}
```

---

## 4. Déclenchement du matching complet (flux principal)

C'est le flux le plus important du système. Il est déclenché manuellement par le RH depuis l'interface.

```mermaid
sequenceDiagram
    actor RH as Responsable RH
    participant C as Client React/Flutter
    participant API as FastAPI :8000\nrh/matching.py
    participant PGV as PostgreSQL\n+ pgvector
    participant SCO as scorer.py
    participant DB as PostgreSQL

    RH->>C: Clique "Lancer le matching"
    C->>API: POST /api/rh/offers/{offer_id}/matching\n?top_n=50&force=false

    API->>DB: SELECT * FROM job_offers WHERE id=offer_id
    DB-->>API: JobOffer {embedding, competences_requises,\nexperience_requise, langue_requise,\npoids_semantique, poids_competences,\npoids_experience, poids_langue}

    alt embedding absent
        API->>API: offer_to_embed_text(offer)
        API->>API: loop.run_in_executor(None, encode, text)
        API->>DB: UPDATE job_offers SET embedding=vector
    end

    Note over API,PGV: === Pré-filtre pgvector KNN ===
    API->>PGV: SELECT cvs.id, (embedding <=> :offer_vec) AS cosine_dist\nFROM cvs\nWHERE statut='INDEXED'\nORDER BY embedding <=> :offer_vec\nLIMIT 200
    PGV->>PGV: Index ivfflat (100 listes)\nRecherche approximative plus proches voisins
    PGV-->>API: [(cv_id, cosine_sim)×200]

    Note over API,SCO: === Scoring multi-critères sur les 200 CVs ===
    loop Pour chacun des 200 CVs
        API->>DB: SELECT cv_entities, competences, experiences\nFROM cvs WHERE id=cv_id
        DB-->>API: CV data

        API->>SCO: compute_final_score(\ncosine_sim=pgvector_result,\ncv_entities=entities,\nrequired_skills=offer.competences_requises,\nrequired_years=offer.experience_requise,\nrequired_langue=offer.langue_requise,\nweights={semantique: 0.40, competences: 0.35,\nexperience: 0.15, langue: 0.10})

        SCO->>SCO: s_sem  = min(1.0, max(0.0, cosine_sim))
        SCO->>SCO: s_comp = |cv_skills ∩ req_skills| / |cv_skills ∪ req_skills|
        SCO->>SCO: s_exp  = min(1.0, cv_years / required_years)
        SCO->>SCO: s_lang = 1.0 if langue_requise in cv_langues else 0.0
        SCO->>SCO: final  = s_sem×0.40 + s_comp×0.35\n        + s_exp×0.15 + s_lang×0.10

        SCO-->>API: {score_matching, score_skills,\nscore_experience, score_langue,\nscore_final} (arrondis à 4 décimales)
    end

    API->>API: Trier par score_final DESC\nSélectionner top_n=50

    Note over API,DB: === Upsert des Resultats ===
    loop Pour chacun des top 50
        API->>DB: SELECT * FROM resultats\nWHERE id_cv=? AND id_offre=?
        DB-->>API: Resultat ou NULL

        alt RETAINED ou REFUSED → immuable
            Note over API: Skip (décision RH conservée)
        else PENDING existant
            API->>DB: UPDATE resultats SET scores, rang
        else Nouveau
            API->>DB: INSERT INTO resultats\n{id_cv, id_offre, scores, rang, decision=PENDING}
        end
    end

    API->>DB: UPDATE job_offers SET last_matching_at=NOW()
    API-->>C: HTTP 200\n{offer_id, titre, total: N,\nresultats: [{cv_id, candidate_nom,\nscore_final, rang, decision}×50]}
    C-->>RH: Tableau des résultats triés par score
```

---

## 5. Prise de décision RH (Retenir / Refuser)

```mermaid
sequenceDiagram
    actor RH as Responsable RH
    participant C as Client React/Flutter
    participant API as FastAPI :8000
    participant DB as PostgreSQL
    participant ML as mailer.py

    RH->>C: Clique "Retenir" ou "Refuser"\n(ouvre Modal feedback)
    RH->>C: Saisit feedback_rh (optionnel)\nCoche feedback_visible (oui/non)

    C->>API: PATCH /api/rh/offers/{offer_id}/matching/{result_id}\n{decision: "RETAINED",\nfeedback_rh: "Profil excellent",\nfeedback_visible: true}

    API->>DB: SELECT * FROM resultats WHERE id=result_id
    DB-->>API: Resultat {id_cv, id_offre, decision, ...}

    API->>DB: UPDATE resultats SET\ndecision=RETAINED,\nfeedback_rh=?,\nfeedback_visible=true,\ndate_decision=NOW()

    alt Decision = RETAINED et email activé
        API->>ML: send_decision_notification(\ncandidat_email, decision=RETAINED,\noffre_titre)
        ML->>ML: SMTP asyncio (fire-and-forget)
    end

    API->>DB: INSERT INTO audit_logs\n{user_id, action="decision_taken",\nresource="resultat", resource_id,\ndetails={decision, offer_id, cv_id}}

    API-->>C: HTTP 200\n{id, decision: RETAINED, rang,\nscore_final, feedback_rh,\nfeedback_visible: true, date_decision}

    C-->>RH: Badge "RETENU" affiché\n(vert, décision immuable)

    Note over C,API: === Côté candidat (consultation ultérieure) ===
    Note over C: GET /api/candidate/applications/{result_id}/detail\nRetourne timeline étape 4 = DÉCISION\net feedback_rh si feedback_visible=true
```
