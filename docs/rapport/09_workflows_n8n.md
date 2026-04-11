# Automatisation avec n8n

## 10.1 Rôle de n8n dans l'architecture

n8n est un outil d'**orchestration de workflows** no-code/low-code. Dans ATS RANDA, il joue un rôle **optionnel et périphérique** : il ne contient aucune logique métier. Toute la logique (génération de créneaux, envoi d'emails, calcul de disponibilités) réside exclusivement dans le **backend Python**.

```
n8n (Port 5678)                   Backend FastAPI (Port 8000)
    │                                      │
    │  Déclencheur (cron ou manuel)        │
    │  ─────────────────────────────────►  │  POST /api/n8n/declencher-generation
    │                                      │  → Génère les créneaux (Python)
    │                                      │  → Stocke dans entretiens (PostgreSQL)
    │  ◄─────────────────────────────────  │
    │  Webhook de confirmation             │
    │  POST /api/n8n/creneaux-generes      │
    │  (header X-N8N-Secret)               │
    │  ─────────────────────────────────►  │  Confirme la génération
    │                                      │
    │  Déclencheur envoi emails            │
    │  ─────────────────────────────────►  │  POST /api/n8n/envoyer-emails-backend
    │                                      │  → Envoie les emails SMTP (mailer.py)
    │  ◄─────────────────────────────────  │  → Statut entretien → ENVOYE
    │  Webhook confirmation emails         │
    │  POST /api/n8n/entretiens/emails-envoyes
    │  ─────────────────────────────────►  │
```

**Principe fondamental** : n8n ne touche pas directement à la base de données. Toute communication passe par les routes REST sécurisées du backend.

---

## 10.2 Workflow de génération de créneaux d'entretien

### Déclenchement

Le RH déclenche la génération de créneaux depuis la page `N8NCalendarPage` via le bouton "Générer les créneaux". Cela appelle :

```
POST /api/n8n/declencher-generation
Authorization: Bearer <rh_token>
```

### Traitement backend

Le backend identifie tous les `Resultats` avec `decision=RETAINED` qui n'ont pas encore d'entretien `PROPOSE` ou `CONFIRME`. Pour chaque candidat retenu, il génère un créneau en tenant compte des disponibilités configurées et crée un enregistrement `Entretien` avec `statut=PROPOSE`.

**Réponse** :
```json
{
  "total_retained": 12,
  "creneaux_generes": [
    {
      "id_entretien": 45,
      "id_candidate": 123,
      "date_entretien": "2026-04-15T10:00:00",
      "statut": "PROPOSE"
    }
  ]
}
```

### Polling frontend

La page `N8NCalendarPage` interroge les créneaux générés toutes les **5 secondes** :
```
GET /api/n8n/propositions
```
Ce polling court permet d'afficher les nouveaux créneaux dès qu'ils sont générés, sans nécessiter de WebSocket.

---

## 10.3 Workflow d'envoi d'emails

### Déclenchement

Depuis `N8NCalendarPage`, le RH valide les créneaux et déclenche l'envoi des invitations :

```
POST /api/n8n/envoyer-emails-backend
Authorization: Bearer <rh_token>
```

### Traitement backend

Le backend récupère tous les `Entretiens` avec `statut=PROPOSE` et `email_envoye=false`. Pour chaque entretien, il appelle `send_entretien_invitation()` du module `core/mailer.py` :

```python
# core/mailer.py
async def send_entretien_invitation(entretien: Entretien) -> bool:
    # Connexion SMTP (Gmail port 587, TLS STARTTLS)
    # Construction de l'email HTML avec :
    #   - Nom du candidat
    #   - Titre de l'offre
    #   - Date et heure de l'entretien
    #   - Lieu ou lien visio
    #   - Logo de l'entreprise (base64 embarqué)
    # Mise à jour : entretien.statut = "ENVOYE", email_envoye = True
```

**Réponse** :
```json
{
  "emails_envoyes": 10,
  "erreurs": 2
}
```

### Polling calendrier

La page `N8NCalendarPage` rafraîchit les entretiens confirmés toutes les **10 secondes** :
```
GET /api/n8n/calendrier
```
Un intervalle plus long est utilisé car les confirmations de rendez-vous sont moins fréquentes que les propositions initiales.

---

## 10.4 Routes backend dédiées n8n

| Méthode | Chemin | Auth | Description |
|---------|--------|------|-------------|
| `POST` | `/api/n8n/declencher-generation` | JWT RH | Générer les créneaux d'entretien |
| `POST` | `/api/n8n/envoyer-emails-backend` | JWT RH | Envoyer les invitations par email |
| `GET` | `/api/n8n/propositions` | JWT RH | Créneaux proposés (polling 5s) |
| `GET` | `/api/n8n/calendrier` | JWT RH | Entretiens confirmés (polling 10s) |
| `POST` | `/api/n8n/creneaux-generes` | `X-N8N-Secret` | Webhook n8n — confirmer génération |
| `POST` | `/api/n8n/entretiens/emails-envoyes` | `X-N8N-Secret` | Webhook n8n — confirmer envoi emails |

Les routes `POST /api/n8n/declencher-generation` et `POST /api/n8n/envoyer-emails-backend` sont protégées par le token JWT RH — elles sont appelées depuis le frontend, pas depuis n8n.

Les webhooks (deux dernières lignes) sont protégés par le header `X-N8N-Secret` — ils sont appelés depuis n8n, pas depuis le frontend.

---

## 10.5 Sécurité des webhooks

```python
# Vérification du secret dans le handler webhook
def verify_n8n_secret(x_n8n_secret: str = Header(...)):
    if x_n8n_secret != settings.N8N_SECRET:
        raise HTTPException(status_code=401, detail="Secret invalide")
```

Le secret est défini dans la variable d'environnement `N8N_SECRET` et configuré dans n8n comme en-tête personnalisé sur les noeuds HTTP Request qui appellent les webhooks.

---

## 10.6 Import des workflows n8n

Les workflows n8n sont versionnés dans le dépôt Git sous `n8n/workflows/`. Procédure d'import :

1. Ouvrir n8n sur http://localhost:5678
2. Se connecter (compte créé au premier lancement)
3. Naviguer vers **Settings** → **Import workflow**
4. Sélectionner les fichiers JSON depuis `n8n/workflows/`
5. Configurer les variables d'environnement dans chaque workflow :
   - URL du backend : `http://backend:8000`
   - Secret : valeur de `N8N_SECRET`
6. Activer les workflows (bouton "Active")

---

## 10.7 Architecture optionnelle

n8n est un **service optionnel** : si le container n8n est arrêté, toutes les fonctionnalités ATS continuent de fonctionner normalement. Seules les automatisations de workflows (génération de créneaux via cron, notifications automatiques) sont indisponibles.

Le RH peut toujours :
- Créer manuellement des entretiens via `CalendarPage`
- Déclencher les emails manuellement via `POST /api/n8n/envoyer-emails-backend` depuis le frontend

Cette conception garantit la **résilience** du système en cas de panne ou d'indisponibilité de n8n.
