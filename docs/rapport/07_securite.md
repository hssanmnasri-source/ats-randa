# Sécurité et Contrôle d'Accès

## 8.1 Authentification JWT

### Création du token

À la connexion (`POST /api/visitor/login`), le backend génère un JWT signé via la fonction `create_access_token` (module `core/security.py`) :

```python
def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
```

| Paramètre | Valeur |
|-----------|--------|
| Algorithme de signature | HS256 (HMAC-SHA256) |
| Clé secrète | `SECRET_KEY` (variable d'environnement, min 32 caractères) |
| Durée de vie | `ACCESS_TOKEN_EXPIRE_MINUTES` (défaut : 60 minutes) |
| Payload standard | `{ sub: email, role: role, exp: timestamp, type: "access" }` |

Un token de rafraîchissement (`create_refresh_token`) est également disponible avec une durée de vie de **7 jours**.

### Validation du token

Sur chaque requête protégée, la dépendance FastAPI `get_current_user()` :
1. Extrait le token Bearer via `HTTPBearer()`.
2. Appelle `decode_token(token)` — retourne `None` si expiré ou signature invalide.
3. Récupère l'utilisateur en base par son email (`sub`).
4. Vérifie que le compte est actif (`is_active=True`).
5. Injecte l'objet `User` dans le handler.

### Stockage côté client

**Frontend web** : le token JWT est stocké dans Zustand (`authStore`) et persisté en `localStorage`. L'intercepteur Axios l'ajoute automatiquement en en-tête `Authorization: Bearer <token>` à chaque requête.

**Application mobile** : le token est stocké dans `flutter_secure_storage` (clé `access_token`), un coffre-fort chiffré au niveau du système d'exploitation (Keychain sur iOS, Keystore sur Android). Jamais en `SharedPreferences` ni en clair.

---

## 8.2 Hachage des mots de passe

Les mots de passe ne sont **jamais stockés en clair**. Le module `core/security.py` utilise **bcrypt** via `passlib` :

```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)
```

bcrypt intègre un **sel aléatoire** unique par mot de passe, rendant les tables arc-en-ciel et les attaques par dictionnaire pré-calculées inefficaces. Le facteur de coût par défaut de passlib est adaptatif pour rester résistant à mesure que le matériel s'accélère.

---

## 8.3 Contrôle d'accès basé sur les rôles (RBAC)

### Les 5 rôles

| Rôle | Périmètre |
|------|-----------|
| `VISITOR` | Consultation des offres publiques, inscription, connexion |
| `CANDIDATE` | Portail candidat complet (profil, CVs, candidatures) |
| `AGENT` | Import et gestion des CVs (avec isolation par `agent_id`) |
| `RH` | Gestion des offres, matching, décisions, calendrier |
| `ADMIN` | Administration globale (utilisateurs, audit, système) |

### Implémentation FastAPI

Les dépendances de rôle sont définies dans `api/dependencies.py` :

```python
# Usine générique
def require_role(*roles: str):
    async def dependency(current_user: User = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(status_code=403, detail="Accès refusé")
        return current_user
    return dependency

# Raccourcis nommés
require_candidate = Depends(require_role("CANDIDATE"))
require_agent     = Depends(require_role("AGENT"))
require_rh        = Depends(require_role("RH"))
require_admin     = Depends(require_role("ADMIN"))
```

Ces dépendances sont injectées dans chaque route via `Depends` :
```python
@router.get("/offers")
async def list_offers(rh: User = Depends(require_rh)):
    ...
```

Un utilisateur avec le mauvais rôle reçoit une réponse `HTTP 403 Forbidden` avant même l'exécution du handler.

---

## 8.4 OAuth2 Google

Le flux OAuth2 Google suit le protocole Authorization Code :

```
1. Client → GET /api/auth/google/login
2. Backend → Redirection vers accounts.google.com
   (scope: openid, email, profile)
3. Utilisateur s'authentifie sur Google
4. Google → Callback GET /api/auth/google/callback?code=...
5. Backend → Échange code contre access_token Google
6. Backend → GET https://www.googleapis.com/oauth2/v2/userinfo
   (récupère email, nom, prénom, avatar, google_id)
7. Backend → Créer/lier le compte :
   - Si email inconnu → nouveau compte (role: CANDIDATE, auth_provider: "google")
   - Si email connu avec auth_provider: "local" → liaison du google_id
   - Si email connu avec auth_provider: "google" → connexion directe
8. Backend → create_access_token → Redirection vers frontend avec token
```

La liaison de compte permet à un utilisateur existant (compte local) de se connecter via Google sans créer de doublon.

---

## 8.5 CORS (Cross-Origin Resource Sharing)

La configuration CORS dans `main.py` permet les origines suivantes :

```python
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Le pattern `http://localhost:\d+` autorise **tout port localhost**, ce qui est essentiel pour l'application Flutter web qui utilise un port aléatoire à chaque démarrage (`flutter run -d chrome`). Sans ce pattern, il faudrait mettre à jour `.env` à chaque session.

En production, cette regex devrait être remplacée par les domaines de production explicites.

---

## 8.6 Isolation agent_id

### Problème

Le système contient plus de 4 000 CVs importés depuis Keejob (`source=KEEJOB`). Sans isolation, un agent verrait la totalité de ces CVs lors de ses requêtes de liste, violant le principe de moindre privilège et exposant des données d'autres agents.

### Implémentation

Chaque CV importé par un agent est marqué avec `id_agent=agent.id`. Tous les endpoints agent passent systématiquement ce filtre aux repositories :

```python
# Route agent — CORRECT
@router.get("/cvs")
async def list_agent_cvs(agent: User = Depends(require_agent), ...):
    return await cv_repository.list_agent_cvs(db, agent_id=agent.id, ...)

# Repository — filtre obligatoire
async def list_agent_cvs(db, agent_id: int, ...):
    query = select(CV).where(
        CV.source == "AGENT",
        CV.id_agent == agent_id  # ← filtre critique
    )
```

Sans ce filtre, `candidate_repository.list_all()` retournerait l'ensemble des 4 000+ candidats Keejob — une fuite de données entre agents et une surcharge applicative.

---

## 8.7 Sécurité des webhooks n8n

Les webhooks entrants depuis n8n (routes `/api/n8n/creneaux-generes` et `/api/n8n/entretiens/emails-envoyes`) sont protégés par un en-tête de sécurité partagé :

```python
X-N8N-Secret: <valeur de la variable N8N_SECRET dans .env>
```

Le backend vérifie cet en-tête avant de traiter la requête. Cela empêche tout appelant non autorisé de déclencher les webhooks n8n directement.

---

## 8.8 Variables d'environnement sensibles

Aucune valeur secrète n'est codée en dur dans le code source. Toutes les configurations sensibles transitent via le fichier `.env` chargé par `core/config.py` (Pydantic `BaseSettings`) :

| Variable | Usage |
|----------|-------|
| `SECRET_KEY` | Signature des tokens JWT |
| `POSTGRES_PASSWORD` | Connexion à la base de données |
| `REDIS_PASSWORD` | Connexion à Redis (broker + cache) |
| `MAIL_PASSWORD` | Mot de passe d'application Gmail |
| `GRAFANA_PASSWORD` | Interface Grafana |
| `FLOWER_PASSWORD` | Interface Flower |
| `N8N_SECRET` | Validation des webhooks n8n |
| `N8N_ENCRYPTION_KEY` | Chiffrement des credentials dans n8n |

Le fichier `.env` est listé dans `.gitignore` — il ne doit jamais être commité dans le dépôt Git. Un fichier `.env.example` avec des valeurs fictives sert de template documentaire.

---

## 8.9 Autres mesures de sécurité

### Validation des entrées

FastAPI + Pydantic valide automatiquement tous les corps de requête (types, longueurs, plages numériques) avant d'appeler le handler. Les erreurs de validation retournent `HTTP 422 Unprocessable Entity` avec le détail des champs invalides.

### Taille maximale des fichiers

Les uploads de fichiers sont limités côté backend :
- CVs candidat : max **5 Mo**
- Import Keejob agent : max **10 Mo**
- Photos de profil : max **2 Mo**

### Isolation des données candidat

Les endpoints candidat vérifient systématiquement que la ressource demandée (CV, candidature) appartient bien au candidat connecté. Un candidat ne peut pas accéder aux CVs ou candidatures d'un autre candidat.
