# n8n — Workflow Automation

Intégration de **n8n** comme moteur d'automation pour la planification automatique des entretiens et l'envoi des emails aux candidats retenus.

---

## Architecture

```
Frontend (RH)
    │
    │  POST /api/n8n/declencher-generation
    ▼
Backend FastAPI ──────────────────────────────────────────────────┐
    │  Génère les créneaux en Python                              │
    │  Sauvegarde → statut PROPOSE                               │
    │                                                             │
    │  POST /api/n8n/envoyer-emails-backend                      │
    │  Envoie les emails via mailer Python                        │
    └──────────────────────────────────────────────────────────── ┘
         ↑
    n8n (optionnel — déclencheur / visualisation)
    http://localhost:5678
```

> La logique métier (génération des créneaux, envoi emails) est entièrement côté **backend Python**. n8n sert de déclencheur et de tableau de bord d'exécution.

---

## Container Docker

```yaml
# docker-compose.yml
n8n:
  image: n8nio/n8n:latest
  container_name: ats_n8n
  ports:
    - "5678:5678"
  environment:
    N8N_HOST: localhost
    N8N_PORT: 5678
    GENERIC_TIMEZONE: Africa/Tunis
    DB_TYPE: postgresdb
    DB_POSTGRESDB_HOST: postgres
    DB_POSTGRESDB_DATABASE: ${POSTGRES_DB}
  volumes:
    - n8n_data:/home/node/.n8n
  networks:
    - ats_network
```

**Accès** : http://localhost:5678 — compte owner configuré à la première connexion.

---

## Variables d'environnement

```env
N8N_USER=admin
N8N_PASSWORD=admin123
N8N_WEBHOOK_URL=http://n8n:5678
N8N_WEBHOOK_SECRET=ats-randa-n8n-secret-2026
```

---

## Routes Backend `/api/n8n/`

### Endpoints RH (authentification JWT requise)

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/api/n8n/declencher-generation` | Génère les créneaux pour tous les RETAINED → statut PROPOSE |
| `GET`  | `/api/n8n/retained-candidates` | Liste les candidats RETAINED groupés par offre |
| `GET`  | `/api/n8n/entretiens/propose` | Entretiens en attente de confirmation RH |
| `PUT`  | `/api/n8n/entretiens/{id}` | Modifier date / type / lieu d'un entretien |
| `POST` | `/api/n8n/entretiens/confirmer-tout` | Confirme tous les PROPOSE → statut CONFIRME |
| `POST` | `/api/n8n/envoyer-emails-backend` | Envoie les emails via le mailer Python |
| `GET`  | `/api/n8n/calendrier` | Calendrier complet (stats + événements) |

### Endpoints Webhook n8n (sécurisés par `X-N8N-Secret`)

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/api/n8n/creneaux-generes` | n8n pousse des créneaux générés (facultatif) |
| `POST` | `/api/n8n/entretiens/emails-envoyes` | n8n marque les emails comme envoyés |

---

## Statuts des entretiens

```
PROPOSE  →  CONFIRME  →  ENVOYE
              │
           ANNULE (à tout moment)
```

| Statut | Description |
|--------|-------------|
| `PROPOSE` | Généré automatiquement, RH n'a pas encore confirmé |
| `CONFIRME` | RH a validé, email pas encore envoyé |
| `ENVOYE` | Email d'invitation envoyé au candidat |
| `ANNULE` | Entretien annulé |
| `PLANIFIE` | Entretien créé manuellement (ancien système) |

---

## Schéma de la table `entretiens`

```sql
CREATE TABLE entretiens (
    id                    SERIAL PRIMARY KEY,
    id_resultat           INTEGER REFERENCES resultats(id),
    id_offre              INTEGER REFERENCES job_offers(id) NOT NULL,
    id_rh                 INTEGER REFERENCES users(id),
    id_candidate_user     INTEGER REFERENCES users(id),
    date_entretien        TIMESTAMPTZ NOT NULL,
    duree_minutes         INTEGER DEFAULT 30,
    lieu                  VARCHAR(255),
    type_entretien        VARCHAR(50) DEFAULT 'presentiel',
    lien_visio            TEXT,
    notes_rh              TEXT,
    statut                VARCHAR(20) DEFAULT 'PLANIFIE',
    email_candidat_envoye BOOLEAN DEFAULT FALSE,
    email_envoye          BOOLEAN DEFAULT FALSE,    -- ajouté n8n
    n8n_execution_id      VARCHAR(255),             -- ajouté n8n
    created_at            TIMESTAMPTZ DEFAULT NOW(),
    updated_at            TIMESTAMPTZ
);
```

---

## Workflows n8n

Les workflows JSON sont dans `n8n/workflows/` et s'importent via **Settings → Import Workflow**.

### 1. `ats_entretiens_workflow.json` — Génération des créneaux

```
Webhook POST /ats-generer-entretiens
    → GET /api/n8n/retained-candidates  (backend)
    → Code JS : génère les créneaux
    → POST /api/n8n/creneaux-generes    (backend)
    → Répondre au webhook
```

> **Note** : Ce workflow est optionnel. Le bouton "Générer" dans l'interface appelle directement `/api/n8n/declencher-generation` qui fait tout côté backend Python.

### 2. `ats_send_emails_workflow.json` — Envoi des emails

```
Webhook POST /ats-envoyer-emails
    → Diviser par candidat (Code JS)
    → Email SMTP (noeud emailSend — nécessite credentials SMTP dans n8n)
    → POST /api/n8n/entretiens/emails-envoyes
```

> **Note** : Sans credentials SMTP dans n8n, utiliser l'endpoint `/api/n8n/envoyer-emails-backend` qui s'appuie sur le mailer Python du backend (configuré dans `.env`).

---

## Algorithme de génération des créneaux

```python
# Prochain lundi à 9h00
slot = prochain_lundi(9h00)

for chaque candidat RETAINED (trié par offre, score décroissant):
    créer entretien(slot, statut=PROPOSE)
    slot += 45 min  # 30 min entretien + 15 min pause

    # Pause déjeuner
    if 12h00 <= slot < 14h00:
        slot = 14h00

    # Fin de journée
    if slot >= 18h00:
        slot = lendemain(9h00)
        skip(samedi, dimanche)
```

---

## Flux utilisateur RH

```
1. /rh/n8n-calendar
       │
2. Cliquer "🚀 Générer les entretiens"
       │ POST /api/n8n/declencher-generation
       │
3. Tableau des créneaux PROPOSE s'affiche
   (rafraîchissement auto toutes les 5s)
       │
4. [Optionnel] Modifier date / type / lieu
       │ PUT /api/n8n/entretiens/{id}
       │
5. Choisir type global (présentiel / visio)
       │
6. Cliquer "✅ Confirmer et envoyer"
       │ POST /api/n8n/entretiens/confirmer-tout
       │ POST /api/n8n/envoyer-emails-backend
       │
7. Statut → ENVOYE
   Emails reçus par les candidats
```

---

## Configuration email (backend)

L'envoi des emails passe par `backend/app/core/mailer.py` via la fonction `send_entretien_invitation()`.

```env
# .env
MAIL_ENABLED=true
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=ats.randa.noreply@gmail.com
MAIL_PASSWORD=<app_password_gmail>
MAIL_FROM=ats.randa.noreply@gmail.com
MAIL_FROM_NAME=ATS RANDA
```

> Si `MAIL_ENABLED=false` (défaut), les emails sont loggés sans être envoyés — utile en développement.

---

## Frontend

- **Page** : `frontend/src/pages/rh/N8NCalendarPage.tsx`
- **Route** : `/rh/n8n-calendar`
- **Menu** : "Entretiens Auto" dans le sidebar RH (`RHLayout.tsx`)

### Queries TanStack

```typescript
// Entretiens en attente (refresh 5s)
useQuery({ queryKey: ['n8n', 'propose'], refetchInterval: 5000 })

// Calendrier complet (refresh 10s)
useQuery({ queryKey: ['n8n', 'calendrier'], refetchInterval: 10000 })
```

---

## Sécurité

- Les routes RH exigent un **JWT Bearer** avec rôle `RH` ou `ADMIN`
- Les webhooks entrants de n8n sont vérifiés via le header `X-N8N-Secret`
- Le frontend ne contacte **jamais** n8n directement (pas de CORS) — tout transite par le backend

---

## Troubleshooting

| Problème | Cause | Fix |
|----------|-------|-----|
| `CORS blocked` | Frontend appelle n8n directement | Utiliser `/api/n8n/declencher-generation` |
| `503 n8n not accessible` | Container `ats_n8n` arrêté | `docker compose up -d n8n` |
| `Workflow not registered 404` | Workflow n8n inactif | Activer dans http://localhost:5678 |
| `No RETAINED found` | Aucune décision RETAINED en base | Effectuer le matching RH d'abord |
| Emails non envoyés | `MAIL_ENABLED=false` | Activer dans `.env` + redémarrer backend |
