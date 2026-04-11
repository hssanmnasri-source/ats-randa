# Diagramme de Cas d'Utilisation — ATS RANDA

## Description

Ce diagramme identifie les 5 acteurs du système (Visiteur, Candidat, Agent, RH, Admin) et leurs cas d'utilisation respectifs, tels que dérivés des routes déclarées dans `backend/app/main.py`, `frontend/src/router/index.tsx` et les modules de routes FastAPI. Chaque acteur interagit avec un périmètre fonctionnel distinct, contrôlé par le RBAC défini dans `api/dependencies.py`.

Les cas d'utilisation sont organisés par portail (URLs préfixées `/candidate/*`, `/agent/*`, `/rh/*`, `/admin/*`). Le système ATS RANDA constitue la frontière du système, et les acteurs externes sont les utilisateurs humains ainsi que le système n8n pour les webhooks automatisés.

## Diagramme Global

```mermaid
flowchart LR
    VIS([Visiteur])
    CAN([Candidat])
    AGT([Agent])
    RH([Responsable RH])
    ADM([Administrateur])
    N8N([n8n Workflows])

    subgraph ATS_RANDA["ATS RANDA — Système"]

        subgraph PUBLIC["Zone publique"]
            UC_REG["S'inscrire"]
            UC_LOG["Se connecter"]
            UC_GOOGLE["Connexion Google OAuth2"]
            UC_LIST_OFF["Consulter offres publiques"]
            UC_DETAIL_OFF["Voir détail d'une offre"]
        end

        subgraph CAND_ZONE["Portail Candidat /candidate/*"]
            UC_PROFIL["Gérer son profil"]
            UC_CV_UP["Déposer un CV"]
            UC_CV_FORM["Soumettre CV via formulaire"]
            UC_CV_VALID["Valider entités extraites"]
            UC_POSTULER["Postuler à une offre"]
            UC_SUIVI["Suivre candidatures timeline"]
            UC_FEEDBACK["Consulter feedback RH"]
            UC_GEN_CV["Générer CV PDF"]
            UC_FAV["Gérer favoris"]
            UC_LETTRE["Gérer lettres de motivation"]
            UC_DOCS["Gérer documents"]
        end

        subgraph AGENT_ZONE["Portail Agent /agent/*"]
            UC_IMP_KEEJOB["Importer CV Keejob"]
            UC_IMP_BATCH["Import batch CVs"]
            UC_OCR_QUAL["Consulter qualité OCR"]
            UC_LIST_CAND["Gérer liste candidats"]
            UC_HIST["Consulter historique imports"]
        end

        subgraph RH_ZONE["Portail RH /rh/*"]
            UC_CRUD_OFF["Gérer offres CRUD"]
            UC_MATCH["Lancer matching sémantique"]
            UC_RESULTATS["Consulter résultats matching"]
            UC_DECISION["Retenir / Refuser candidat"]
            UC_FEEDBACK_RH["Donner feedback candidat"]
            UC_CAL["Gérer calendrier entretiens"]
            UC_N8N["Déclencher workflow n8n"]
            UC_CVTH["Consulter CVthèque"]
            UC_STATS["Consulter statistiques"]
            UC_POIDS["Configurer pondérations scoring"]
        end

        subgraph ADMIN_ZONE["Portail Admin /admin/*"]
            UC_USERS["Gérer utilisateurs"]
            UC_ROLES["Attribuer rôles"]
            UC_AUDIT["Consulter logs d'audit"]
            UC_HEALTH["Vérifier santé système"]
            UC_STATS_G["Statistiques globales"]
        end

        subgraph N8N_ZONE["Zone n8n /api/n8n/*"]
            UC_CRENEAUX["Générer créneaux entretien"]
            UC_EMAILS["Envoyer invitations email"]
            UC_WH_IN["Webhook entrant"]
        end
    end

    VIS --> UC_REG
    VIS --> UC_LOG
    VIS --> UC_GOOGLE
    VIS --> UC_LIST_OFF
    VIS --> UC_DETAIL_OFF

    CAN --> UC_PROFIL
    CAN --> UC_CV_UP
    CAN --> UC_CV_FORM
    CAN --> UC_CV_VALID
    CAN --> UC_POSTULER
    CAN --> UC_SUIVI
    CAN --> UC_FEEDBACK
    CAN --> UC_GEN_CV
    CAN --> UC_FAV
    CAN --> UC_LETTRE
    CAN --> UC_DOCS
    CAN --> UC_LIST_OFF

    AGT --> UC_IMP_KEEJOB
    AGT --> UC_IMP_BATCH
    AGT --> UC_OCR_QUAL
    AGT --> UC_LIST_CAND
    AGT --> UC_HIST

    RH --> UC_CRUD_OFF
    RH --> UC_MATCH
    RH --> UC_RESULTATS
    RH --> UC_DECISION
    RH --> UC_FEEDBACK_RH
    RH --> UC_CAL
    RH --> UC_N8N
    RH --> UC_CVTH
    RH --> UC_STATS
    RH --> UC_POIDS

    ADM --> UC_USERS
    ADM --> UC_ROLES
    ADM --> UC_AUDIT
    ADM --> UC_HEALTH
    ADM --> UC_STATS_G

    N8N --> UC_WH_IN
    UC_N8N --> UC_CRENEAUX
    UC_N8N --> UC_EMAILS
```

## Diagrammes Détaillés par Acteur

### Visiteur

```mermaid
flowchart LR
    VIS([Visiteur])
    subgraph S["ATS RANDA — Zone publique"]
        A["S'inscrire\nPOST /api/visitor/register"]
        B["Se connecter\nPOST /api/visitor/login"]
        C["Connexion Google OAuth2\nGET /api/auth/google/login"]
        D["Consulter offres actives\nGET /api/visitor/offers"]
        E["Voir détail offre\nGET /api/visitor/offers/:id"]
    end
    VIS --> A & B & C & D & E
    D --> E
```

### Candidat

```mermaid
flowchart LR
    CAN([Candidat])
    subgraph S["ATS RANDA — Portail Candidat"]
        P1["Gérer profil\n(base, personnel, pro, visibilité)"]
        P2["Uploader photo de profil"]
        P3["Gérer expériences professionnelles"]
        P4["Gérer compétences"]
        CV1["Déposer CV PDF\nPOST /api/candidate/cvs/upload"]
        CV2["Soumettre CV formulaire\nPOST /api/candidate/cvs/form"]
        CV3["Valider entités extraites\nPUT /api/candidate/cvs/:id/validate"]
        CV4["Générer CV PDF\nreact-to-print"]
        APP1["Postuler à une offre\nPOST /api/candidate/offers/:id/apply"]
        APP2["Suivre candidatures\nGET /api/candidate/applications"]
        APP3["Timeline 4 étapes\nGET /api/candidate/applications/:id/detail"]
        APP4["Consulter feedback RH\nsi feedback_visible=true"]
        APP5["Retirer candidature\nDELETE (si PENDING)"]
        FAV["Gérer favoris\nlocalStorage"]
        DOC["Gérer documents joints"]
        LET["Gérer lettres de motivation"]
    end
    CAN --> P1 & P2 & P3 & P4
    CAN --> CV1 & CV2 & CV3 & CV4
    CAN --> APP1 --> APP2 --> APP3 --> APP4
    CAN --> APP5
    CAN --> FAV & DOC & LET
```

### Agent

```mermaid
flowchart LR
    AGT([Agent de saisie])
    subgraph S["ATS RANDA — Portail Agent"]
        A1["Importer CV Keejob\nPOST /api/agent/import/keejob\n(parsing synchrone, 15+ entités)"]
        A2["Uploader CV unitaire\nPOST /api/agent/cvs/upload\n(OCR + score qualité)"]
        A3["Import batch CVs\nPOST /api/agent/cvs/batch\n(max 10 fichiers)"]
        A4["Consulter score qualité OCR\n(score 0-100, conseils)"]
        A5["Consulter liste CVs\nGET /api/agent/cvs\n(filtrés par agent_id)"]
        A6["Consulter historique imports\nGET /api/agent/history"]
        A7["Rechercher candidats\nGET /api/agent/candidates"]
    end
    AGT --> A1 & A2 & A3
    A2 --> A4
    AGT --> A5 & A6 & A7
```

### Responsable RH

```mermaid
flowchart LR
    RH([Responsable RH])
    subgraph S["ATS RANDA — Portail RH"]
        O1["Créer offre\nPOST /api/rh/offers\n(statut initial: BROUILLON)"]
        O2["Modifier offre\nPUT /api/rh/offers/:id"]
        O3["Gérer statut offre\nPATCH /api/rh/offers/:id/statut"]
        O4["Configurer pondérations\nPUT /api/rh/offers/:id/poids"]
        M1["Lancer matching\nPOST /api/rh/offers/:id/matching\n(pgvector + scoring 4 critères)"]
        M2["Consulter résultats\nGET /api/rh/offers/:id/matching\n(filtres avancés)"]
        M3["Décision RETENU/REFUSÉ\nPATCH /api/rh/offers/:id/matching/:rid"]
        M4["Donner feedback\n(feedback_visible au candidat)"]
        M5["Exporter résultats PDF\nGET /api/rh/offers/:id/export/pdf"]
        C1["Calendrier manuel\nGET /api/rh/calendar"]
        N1["Déclencher n8n\nPOST /api/n8n/declencher-generation"]
        N2["Envoyer emails\nPOST /api/n8n/envoyer-emails-backend"]
        S1["Dashboard stats\nGET /api/rh/dashboard"]
        S2["Stats par offre\nGET /api/rh/offers/:id/stats"]
        CV1["Consulter CVthèque\nGET /api/rh/cvs"]
    end
    RH --> O1 --> O2 --> O3
    RH --> O4
    RH --> M1 --> M2 --> M3 --> M4
    RH --> M5 & C1 & N1 --> N2
    RH --> S1 & S2 & CV1
```

### Administrateur

```mermaid
flowchart LR
    ADM([Administrateur])
    subgraph S["ATS RANDA — Portail Admin"]
        U1["Créer utilisateur\nPOST /api/admin/users"]
        U2["Modifier utilisateur\nPUT /api/admin/users/:id"]
        U3["Activer / Désactiver compte\nPATCH /api/admin/users/:id/toggle"]
        U4["Attribuer rôle\n(champ role dans UserUpdateIn)"]
        A1["Consulter logs d'audit\nGET /api/admin/audit"]
        A2["Statistiques globales\nGET /api/admin/stats"]
        A3["Santé système\nGET /api/admin/system"]
        A4["Gérer CVs globalement\nGET /api/admin/cvs"]
    end
    ADM --> U1 & U2 & U3 & U4
    ADM --> A1 & A2 & A3 & A4
```

## Tableau des droits d'accès

| Fonctionnalité | Visiteur | Candidat | Agent | RH | Admin |
|---------------|:--------:|:--------:|:-----:|:--:|:-----:|
| Consulter offres publiques | ✅ | ✅ | — | — | — |
| S'inscrire / Se connecter | ✅ | ✅ | ✅ | ✅ | ✅ |
| Connexion Google OAuth2 | ✅ | ✅ | — | — | — |
| Gérer profil candidat | — | ✅ | — | — | — |
| Déposer / gérer CVs | — | ✅ | — | — | — |
| Postuler à une offre | — | ✅ | — | — | — |
| Suivre candidatures (timeline) | — | ✅ | — | — | — |
| Générer CV PDF | — | ✅ | — | — | — |
| Importer CVs Keejob/batch | — | — | ✅ | — | — |
| Consulter qualité OCR | — | — | ✅ | — | — |
| Historique imports | — | — | ✅ | — | — |
| Créer / modifier offres | — | — | — | ✅ | — |
| Lancer matching sémantique | — | — | — | ✅ | — |
| Décision RETENU/REFUSÉ | — | — | — | ✅ | — |
| Donner feedback visible | — | — | — | ✅ | — |
| Calendrier entretiens | — | — | — | ✅ | — |
| Déclencher workflow n8n | — | — | — | ✅ | — |
| Statistiques par offre | — | — | — | ✅ | — |
| CVthèque globale | — | — | — | ✅ | ✅ |
| Gérer utilisateurs / rôles | — | — | — | — | ✅ |
| Logs d'audit | — | — | — | — | ✅ |
| Santé système | — | — | — | — | ✅ |
| Statistiques globales système | — | — | — | — | ✅ |
