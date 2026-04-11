# Diagrammes d'Activités — Processus Métier ATS RANDA

## Description

Ces diagrammes d'activités modélisent les processus métier complets du système ATS RANDA, en utilisant des swimlanes pour distinguer les acteurs. Ils illustrent les décisions, les parallélismes et les flux entre les différents acteurs : Agent de saisie, Responsable RH, le système NLP (Celery), le Candidat, et le système n8n. Ces diagrammes sont construits à partir de la logique métier implémentée dans `cv_tasks.py`, `scorer.py`, les routes FastAPI et le workflow n8n.

---

## 1. Processus complet de recrutement (bout en bout)

```mermaid
flowchart TD
    START([Début processus recrutement]) --> A1

    subgraph AGENT["Agent de saisie"]
        A1["Reçoit PDF CV candidat"]
        A2{"Format Keejob ?"}
        A3["POST /api/agent/import/keejob\n(parsing synchrone)"]
        A4["POST /api/agent/cvs/upload\n(OCR + Celery async)"]
        A5["Vérifie score qualité OCR\n(score 0-100)"]
        A6{"Score ≥ 40 ?"}
        A7["Alerte : qualité insuffisante\n(conseils affichés)"]
    end

    subgraph NLP["Système NLP — Celery Worker"]
        N1["Tâche process_cv_on_upload(cv_id)"]
        N2["extract_text_from_pdf()\n(pdfplumber ou Tesseract fra+eng+ara)"]
        N3{"cv_entities\nexistant ?"}
        N4["parse_keejob_cv() OU\nparse_generic_cv()"]
        N5["cv_to_embed_text(cv_entities, cv_text)"]
        N6["encode(text) → Vector(384)\n(paraphrase-multilingual-MiniLM-L12-v2)"]
        N7["UPDATE cv.statut = INDEXED\ncv.embedding = vector\ncv.cv_version += 1"]
        N8["SELECT job_offers WHERE statut=ACTIVE"]
        N9{"Pour chaque offre\nactive"}
        N10["compute_final_score(\ncosine_sim, jaccard, exp, langue)"]
        N11{"Resultat\nexistant ?"}
        N12{"Decision =\nRETAINED/REFUSED ?"}
        N13["UPDATE scores\n(PENDING conservé)"]
        N14["INSERT Resultat\n{decision=PENDING}"]
        N15["SKIP\n(immuable)"]
    end

    subgraph RH["Responsable RH"]
        R1["Crée offre d'emploi\nPOST /api/rh/offers\n(statut: BROUILLON)"]
        R2["Configure pondérations\nPUT .../poids\n(40%+35%+15%+10%=1.0)"]
        R3["Publie offre\nPATCH .../statut → ACTIVE"]
        R4["Lance matching\nPOST .../matching?top_n=50"]
        R5["pgvector KNN\ntop 200 CVs par cosinus"]
        R6["scorer.py\ntop 50 par score_final"]
        R7["Consulte résultats\nGET .../matching (filtres)"]
        R8{"Décision ?"}
        R9["PATCH → RETAINED\n+ feedback optionnel"]
        R10["PATCH → REFUSED\n+ feedback optionnel"]
        R11["Déclenche n8n\nPOST /api/n8n/declencher-generation"]
    end

    subgraph N8N_SWIM["n8n + Mailer"]
        NW1["Génère créneaux\npour candidats RETAINED"]
        NW2["INSERT entretiens\nstatut=PROPOSE"]
        NW3["Envoie invitations\nPOST /api/n8n/envoyer-emails-backend"]
        NW4["mailer.py → SMTP Gmail\nemail_envoye=true"]
    end

    subgraph CANDIDAT["Candidat"]
        C1["Consulte offres\nGET /api/visitor/offers"]
        C2["Postule\nPOST .../apply"]
        C3["Suit sa timeline\nGET .../detail\n(4 étapes)"]
        C4["Reçoit feedback\n(si feedback_visible=true)"]
        C5["Reçoit email entretien\nConfirme sa présence"]
    end

    %% Flux Agent
    A1 --> A2
    A2 -->|Oui| A3
    A2 -->|Non| A4
    A4 --> A5 --> A6
    A6 -->|Non| A7
    A6 -->|Oui| N1
    A3 --> R1

    %% Flux NLP
    N1 --> N2 --> N3
    N3 -->|Non| N4 --> N5
    N3 -->|Oui| N5
    N5 --> N6 --> N7 --> N8 --> N9
    N9 --> N10 --> N11
    N11 -->|Oui| N12
    N11 -->|Non| N14
    N12 -->|Oui| N15
    N12 -->|Non| N13

    %% Flux RH
    R1 --> R2 --> R3
    R3 -.->|"Embedding généré\n(Celery embed_offer)"| N1
    R3 --> R4 --> R5 --> R6 --> R7 --> R8
    R8 -->|Retenir| R9 --> R11
    R8 -->|Refuser| R10

    %% Flux n8n
    R11 --> NW1 --> NW2 --> NW3 --> NW4

    %% Flux candidat
    C1 --> C2 --> C3 --> C4
    NW4 --> C5

    %% Connexions cross-swimlane
    N7 -.->|"CV indexé\nscores calculés"| C3
    R9 -.->|"feedback_visible=true"| C4
```

---

## 2. Processus d'import et indexation de CV

```mermaid
flowchart TD
    START([Réception fichier CV]) --> V1

    V1{"Type de source ?"}

    V1 -->|"Agent — Format Keejob"| K1
    V1 -->|"Agent — Format libre"| A1
    V1 -->|"Candidat — Upload"| CA1
    V1 -->|"Candidat — Formulaire"| CF1

    subgraph KEEJOB["Import Keejob (synchrone)"]
        K1["extract_text_from_pdf(bytes)\npdfplumber"]
        K2["parse_keejob_cv(text)\nRegex 15+ champs"]
        K3["INSERT candidates (si email inconnu)\nINSERT cvs {source=AGENT, statut=INDEXED}"]
        K4["INSERT competences[] (batch)\nINSERT experiences[] (batch)"]
        K5["Retourner entités immédiatement\n→ HTTP 201"]
    end

    subgraph AGENT_LIBRE["Import agent libre (async)"]
        A1["Sauvegarde fichier\n/app/uploads/cvs/uuid.pdf"]
        A2["INSERT cvs {statut=UPLOADED, source=AGENT}"]
        A3["Évaluer OCR qualité\nevaluate_ocr_quality(text)"]
        A4{"Score ≥ 60 ?"}
        A5["Niveau BON/EXCELLENT\nContinuer"]
        A6["Niveau MOYEN/FAIBLE\nAfficher conseils"]
        A7["→ HTTP 201 + ocr_quality"]
        A8["Celery: process_cv_on_upload(cv_id)"]
    end

    subgraph CANDIDAT_UP["Upload candidat (async)"]
        CA1["Sauvegarde fichier"]
        CA2["INSERT cvs {statut=UPLOADED, source=CANDIDAT}"]
        CA3["→ HTTP 201 {cv_id, statut: UPLOADED}"]
        CA4["Celery: process_cv_on_upload(cv_id)"]
    end

    subgraph CANDIDAT_FORM["Formulaire candidat (sync)"]
        CF1["Validation Pydantic\n(titre_poste, competences ≥1, resume ≥50ch)"]
        CF2["Construire cv_entities depuis formulaire"]
        CF3["encode(cv_to_embed_text(entities)) → Vector(384)"]
        CF4["INSERT cvs {statut=INDEXED, source=CANDIDAT,\ncv_entities, embedding}"]
        CF5["INSERT competences[] (depuis formulaire)"]
        CF6["→ HTTP 201 {statut: INDEXED}"]
    end

    subgraph CELERY_PROC["Traitement Celery commun (async)"]
        CEL1["Charger CV depuis DB"]
        CEL2["Extraire texte (OCR si nécessaire)"]
        CEL3["Parser entités (keejob ou generic)"]
        CEL4["cv_to_embed_text()"]
        CEL5["encode() → Vector(384)\n(dans thread pool, ~20-50ms)"]
        CEL6["UPDATE cv:\nembedding=vector\nstatut=INDEXED\ncv_version+=1"]
        CEL7["Pour chaque offre ACTIVE:\ncompute_final_score()\nupsert Resultat"]
    end

    K1 --> K2 --> K3 --> K4 --> K5
    A1 --> A2 --> A3 --> A4
    A4 -->|Oui| A5 --> A7
    A4 -->|Non| A6 --> A7
    A7 --> A8 --> CEL1
    CA1 --> CA2 --> CA3 --> CA4 --> CEL1
    CF1 --> CF2 --> CF3 --> CF4 --> CF5 --> CF6

    CEL1 --> CEL2 --> CEL3 --> CEL4 --> CEL5 --> CEL6 --> CEL7
    CEL7 --> END([CV indexé + Résultats calculés])
```

---

## 3. Processus de matching sémantique

```mermaid
flowchart TD
    START([RH lance le matching]) --> CHK1

    CHK1{"Embedding offre\nexistant ?"}
    CHK1 -->|Non| EMB1["offer_to_embed_text(offer)\n→ encode() → Vector(384)\nUPDATE job_offers SET embedding"]
    CHK1 -->|Oui| PGV1
    EMB1 --> PGV1

    subgraph PGVECTOR["Pré-filtre pgvector"]
        PGV1["SELECT cv_id, (embedding <=> offer_vec) AS cosine\nFROM cvs WHERE statut=INDEXED\nORDER BY cosine\nLIMIT 200"]
        PGV2["Index ivfflat (100 listes)\nRecherche approximative KNN\n~10-30x plus rapide que scan séquentiel"]
    end

    PGV1 --> PGV2 --> LOOP1

    subgraph SCORING["Scoring multi-critères (scorer.py)"]
        LOOP1["Pour chacun des 200 CVs"]
        LOOP1 --> S1 & S2 & S3 & S4

        S1["score_semantique\n= min(1.0, cosine_sim)\n[40% par défaut]"]
        S2["score_competences\n= |cv∩requis| / |cv∪requis|\nJaccard — insensible casse\n[35% par défaut]"]
        S3["score_experience\n= min(1.0, cv_years/req_years)\n[15% par défaut]"]
        S4["score_langue\n= 1.0 si langue in cv_langues\nsinon 0.0 (binaire)\n[10% par défaut]"]

        S1 & S2 & S3 & S4 --> FINAL["score_final =\nΣ(score_i × poids_i)\n(arrondis à 4 décimales)"]
    end

    FINAL --> SORT["Trier par score_final DESC\nSélectionner top_n=50"]

    SORT --> UPSERT{"Resultat existant ?"}

    UPSERT -->|"Non"| INS["INSERT resultats\n{id_cv, id_offre, scores, rang,\ndecision=PENDING}"]
    UPSERT -->|"Oui + PENDING"| UPD["UPDATE resultats\nSET scores, rang"]
    UPSERT -->|"Oui + RETAINED/REFUSED"| SKIP["SKIP — décision RH immuable\n(ne jamais écraser)"]

    INS & UPD & SKIP --> DONE["UPDATE job_offers\nSET last_matching_at=NOW()"]

    DONE --> END(["Retourner top N résultats\nav scores, rang, decision\nau client React/Flutter"])
```

---

## 4. Processus de génération et envoi d'invitations

```mermaid
flowchart TD
    START([RH clique "Générer créneaux"]) --> Q1

    subgraph RH_SWIM["RH — N8NCalendarPage"]
        Q1["POST /api/n8n/declencher-generation"]
        Q2["Consulte résultats\n(polling 5s GET /api/n8n/propositions)"]
        Q3["Valide les créneaux proposés"]
        Q4["POST /api/n8n/envoyer-emails-backend"]
        Q5["Consulte calendrier mis à jour\n(polling 10s GET /api/n8n/calendrier)"]
    end

    subgraph BACKEND_N8N["Backend — n8n_webhook.py"]
        B1["SELECT resultats JOIN candidates\nWHERE decision=RETAINED\nAND pas d'entretien PROPOSE/CONFIRME"]
        B2{"Candidats\nà traiter ?"}
        B3["Pour chaque candidat RETAINED :\nCalcul créneau disponible"]
        B4["INSERT entretiens\n{statut=PROPOSE, email_envoye=false}"]
        B5["SELECT entretiens\nWHERE statut=PROPOSE\nAND email_envoye=false"]
        B6["Pour chaque entretien :\nmailer.send_entretien_invitation()\n(SMTP Gmail :587)"]
        B7{"Email\nenvoyé ?"}
        B8["UPDATE entretiens\nSET statut=ENVOYE\nemail_envoye=true"]
        B9["Comptabiliser erreur\n(continuer les suivants)"]
    end

    subgraph CANDIDAT_RCV["Candidat — Email reçu"]
        C1["Reçoit email HTML\n(logo + détails entretien)"]
        C2["Confirme sa présence\n(ou décline)"]
    end

    Q1 --> B1 --> B2
    B2 -->|"Aucun"| END1(["Retour: total_retained=0"])
    B2 -->|"N candidats"| B3 --> B4

    B4 --> Q2 --> Q3 --> Q4 --> B5 --> B6 --> B7
    B7 -->|Oui| B8 --> Q5
    B7 -->|Non| B9 --> B6

    Q5 --> END2(["Calendrier mis à jour\nEntretiens ENVOYE visibles"])
    B8 --> C1 --> C2
```
