# Diagrammes de Séquence — Authentification

## Description

Ces diagrammes décrivent les flux d'authentification complets de l'ATS RANDA, tels qu'implémentés dans `backend/app/core/security.py`, `backend/app/api/routes/visitor/auth.py`, `backend/app/api/routes/auth/google.py` et `backend/app/api/dependencies.py`. Ils montrent les interactions entre le client (web React ou app Flutter), Nginx, FastAPI, le module de sécurité bcrypt/JWT, et la base de données PostgreSQL.

---

## 1. Connexion classique (email / mot de passe)

Le flux de connexion locale suit le schéma : soumission des identifiants → vérification bcrypt → génération JWT → stockage côté client → utilisation sur les requêtes suivantes.

```mermaid
sequenceDiagram
    actor U as Utilisateur
    participant C as Client (React/Flutter)
    participant N as Nginx :80
    participant API as FastAPI :8000
    participant SEC as security.py
    participant DB as PostgreSQL

    U->>C: Saisit email + mot de passe
    C->>N: POST /api/visitor/login\n{email, password}
    N->>API: Proxy → POST /api/visitor/login
    API->>DB: SELECT * FROM users WHERE email=?
    DB-->>API: User {id, hashed_pwd, role, is_active}

    alt Utilisateur introuvable
        API-->>C: HTTP 401 Unauthorized\n{"detail": "Email ou mot de passe incorrect"}
    else Compte désactivé
        API-->>C: HTTP 401 Unauthorized\n{"detail": "Compte désactivé"}
    else Identifiants valides
        API->>SEC: verify_password(plain, hashed_pwd)
        SEC->>SEC: pwd_context.verify(plain, hashed_pwd)\n(bcrypt compare)
        SEC-->>API: True

        API->>SEC: create_access_token({sub: user.id, role: user.role})
        SEC->>SEC: payload = {sub, role, exp: +60min, type: "access"}\njwt.encode(payload, SECRET_KEY, HS256)
        SEC-->>API: access_token (JWT)

        API-->>N: HTTP 200 {access_token, token_type: "bearer"}
        N-->>C: HTTP 200 {access_token, token_type: "bearer"}

        alt Client Web (React)
            C->>C: authStore.setToken(access_token)\n(Zustand + localStorage)
        else Client Mobile (Flutter)
            C->>C: flutter_secure_storage.write\n(key: "access_token", value: token)
        end

        C-->>U: Redirection vers le portail\n(/candidate, /rh, /agent, /admin)
    end
```

---

## 2. Connexion Google OAuth2

Le flux OAuth2 implique Google comme serveur d'autorisation. Les routes sont définies dans `backend/app/api/routes/auth/google.py`.

```mermaid
sequenceDiagram
    actor U as Utilisateur
    participant C as Client (Navigateur)
    participant API as FastAPI :8000
    participant G as Google OAuth2\n(accounts.google.com)
    participant DB as PostgreSQL

    U->>C: Clique "Connexion avec Google"
    C->>API: GET /api/auth/google/login
    API-->>C: HTTP 302 Redirect\n→ accounts.google.com/o/oauth2/auth\n(scope: openid email profile)

    C->>G: Redirection automatique vers Google
    U->>G: S'authentifie sur Google
    G->>C: Redirection → /api/auth/google/callback?code=AUTH_CODE

    C->>API: GET /api/auth/google/callback?code=AUTH_CODE
    API->>G: POST /token\n{code, client_id, client_secret, redirect_uri}
    G-->>API: {access_token, id_token}

    API->>G: GET /oauth2/v2/userinfo\n(Authorization: Bearer access_token)
    G-->>API: {email, name, given_name, family_name, picture, sub (google_id)}

    API->>DB: SELECT * FROM users WHERE email=?
    DB-->>API: User ou NULL

    alt Email inconnu → nouveau compte
        API->>DB: INSERT INTO users\n{email, nom, prenom, google_id, auth_provider: "google",\nrole: CANDIDATE, hashed_pwd: ""}
        DB-->>API: New User
    else Email existant (compte local) → liaison
        API->>DB: UPDATE users SET google_id=? WHERE email=?
        DB-->>API: Updated User
    else Email existant (compte Google) → connexion
        Note over API,DB: Utilisateur reconnu par google_id
    end

    API->>API: create_access_token({sub: user.id, role: user.role})
    API-->>C: HTTP 302 Redirect\n→ /auth/google/success?token=JWT
    C->>C: GoogleCallbackPage extrait le token\n→ authStore.setToken(token)
    C-->>U: Redirection vers /candidate
```

---

## 3. Validation JWT sur une route protégée

Ce diagramme montre comment chaque requête vers une route protégée est validée, via la dépendance `get_current_user` définie dans `api/dependencies.py`.

```mermaid
sequenceDiagram
    participant C as Client
    participant N as Nginx :80
    participant API as FastAPI :8000
    participant DEP as dependencies.py\nget_current_user()
    participant SEC as security.py\ndecode_token()
    participant DB as PostgreSQL

    C->>N: GET /api/rh/offers\nAuthorization: Bearer eyJhbGci...
    N->>API: Proxy request

    API->>DEP: Injection Depends(bearer)\nExtraction token depuis header
    DEP->>SEC: decode_token(token)
    SEC->>SEC: jwt.decode(token, SECRET_KEY,\nalgorithms=["HS256"])

    alt Token invalide ou expiré
        SEC-->>DEP: None (JWTError capturée)
        DEP-->>API: HTTP 401\n{"detail": "Token invalide ou expiré"}
        API-->>C: HTTP 401 Unauthorized
    else Token valide
        SEC-->>DEP: payload {sub: user_id, role, exp, type: "access"}
        DEP->>DB: SELECT * FROM users WHERE id=payload["sub"]
        DB-->>DEP: User

        alt Utilisateur introuvable ou is_active=False
            DEP-->>API: HTTP 401\n{"detail": "Utilisateur introuvable"}
            API-->>C: HTTP 401 Unauthorized
        else OK — vérification rôle
            DEP->>DEP: require_role("RH")\nuser.role.value == "RH" ?

            alt Mauvais rôle
                DEP-->>API: HTTP 403\n{"detail": "Accès refusé — rôle requis: RH"}
                API-->>C: HTTP 403 Forbidden
            else Rôle autorisé
                DEP-->>API: User injecté dans le handler
                API->>DB: Exécute la requête métier
                DB-->>API: Données
                API-->>C: HTTP 200 + données JSON
            end
        end
    end
```

---

## 4. Déconnexion et expiration du token

```mermaid
sequenceDiagram
    actor U as Utilisateur
    participant C as Client
    participant API as FastAPI :8000

    rect rgb(240, 240, 255)
        Note over U,API: Déconnexion volontaire
        U->>C: Clique "Se déconnecter"
        alt Client Web (React)
            C->>C: authStore.logout()\nZustand: user=null, token=null\nlocalStorage.removeItem("auth-storage")
        else Client Mobile (Flutter)
            C->>C: authStateProvider.logout()\nflutter_secure_storage.delete("access_token")
        end
        C-->>U: Redirection → /login
        Note over C: Le token n'est pas invalidé côté serveur\n(JWT stateless — expiration naturelle)
    end

    rect rgb(255, 240, 240)
        Note over U,API: Expiration automatique du token
        U->>C: Action quelconque (après 60 min)
        C->>API: GET /api/rh/offers\nAuthorization: Bearer <token expiré>
        API->>API: decode_token() → JWTError (exp dépassé)
        API-->>C: HTTP 401 {"detail": "Token invalide ou expiré"}

        alt Client Web (React)
            C->>C: Intercepteur Axios 401\nauthStore.logout()\nRedirection → /login
        else Client Mobile (Flutter)
            C->>C: _AuthInterceptor.onError()\nauthStateProvider.logout()\nGoRouter redirect → /login
        end
        C-->>U: Écran de connexion
    end
```
