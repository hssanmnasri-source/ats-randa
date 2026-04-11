# Diagrammes de Séquence — Application Mobile Flutter RH

## Description

Ces diagrammes illustrent les flux spécifiques à l'application mobile Flutter RH, construite avec Riverpod, GoRouter et Dio. Ils sont basés sur le code réel de `mobile/lib/providers/auth_provider.dart`, `mobile/lib/router.dart`, `mobile/lib/providers/matching_provider.dart` et `mobile/lib/core/api_client.dart`. L'application cible exclusivement le rôle **RH** et se synchronise avec le backend FastAPI via Dio avec intercepteur JWT.

---

## 1. Démarrage de l'application et restauration de session

Au démarrage, `AuthNotifier.build()` tente de restaurer la session depuis `flutter_secure_storage` avant que GoRouter n'évalue la redirection.

```mermaid
sequenceDiagram
    participant APP as main.dart\nProviderScope
    participant AUTH as authStateProvider\nAuthNotifier.build()
    participant SEC as flutter_secure_storage
    participant REPO as AuthRepository
    participant DIO as api_client.dart\nDio + _AuthInterceptor
    participant API as FastAPI :8000
    participant ROUTER as routerProvider\nGoRouter
    participant UI as Interface Flutter

    APP->>AUTH: ProviderScope → AsyncNotifier.build()
    AUTH->>SEC: hasToken()\nawait _storage.read(key: "access_token")

    alt Token absent (premiere installation ou déconnexion)
        SEC-->>AUTH: null
        AUTH-->>ROUTER: AsyncData(null)
        ROUTER->>ROUTER: redirect() : !isLoggedIn && !isPublic\n→ return '/login'
        ROUTER->>UI: Affiche LoginScreen
    else Token présent
        SEC-->>AUTH: access_token (String)
        AUTH->>REPO: getProfile()
        REPO->>DIO: GET /api/rh/me\n(token injecté par _AuthInterceptor)
        DIO->>API: GET /api/rh/me\nAuthorization: Bearer <token>

        alt Token expiré (401)
            API-->>DIO: HTTP 401
            DIO->>DIO: _AuthInterceptor.onError()\nauthorization=null
            DIO-->>REPO: DioException
            REPO-->>AUTH: Exception
            AUTH->>SEC: clearTokens()\ndelete("access_token")
            AUTH-->>ROUTER: AsyncData(null)
            ROUTER->>UI: Affiche LoginScreen
        else Token valide
            API-->>DIO: HTTP 200 {id, email, nom, prenom, role: "RH"}
            DIO-->>REPO: RhUser data
            REPO-->>AUTH: RhUser
            AUTH-->>ROUTER: AsyncData(RhUser)
            ROUTER->>ROUTER: redirect() : isLoggedIn && isPublic→ null\ninitialLocation='/dashboard'
            ROUTER->>UI: Affiche DashboardScreen\n(dans AppShell)
        end
    end
```

---

## 2. Navigation et chargement du tableau de bord RH

Le tableau de bord utilise `dashboardStatsProvider` qui agrège des données depuis plusieurs providers Riverpod.

```mermaid
sequenceDiagram
    actor RH as Responsable RH
    participant UI as DashboardScreen\n(ConsumerWidget)
    participant DASH as dashboardStatsProvider\nFutureProvider
    participant REPO as StatsRepository
    participant OFF as offersProvider\nFutureProvider.autoDispose
    participant OREP as OffersRepository
    participant DIO as Dio + _AuthInterceptor
    participant API as FastAPI :8000

    RH->>UI: Navigation vers /dashboard\n(ShellRoute AppShell tab 0)

    UI->>DASH: ref.watch(dashboardStatsProvider)
    DASH->>REPO: getDashboardStats()

    par Appels parallèles
        REPO->>DIO: GET /api/rh/me
        DIO->>API: GET /api/rh/me
        API-->>DIO: {id, email, nom, prenom}
        DIO-->>REPO: RhUser
    and
        REPO->>DIO: GET /api/rh/dashboard/stats
        DIO->>API: GET /api/rh/dashboard/stats
        API-->>DIO: {mes_offres: {actives, total},\ncandidatures: {total, pending, retained, nouvelles_24h},\ncvtheque: {total_cvs}}
        DIO-->>REPO: DashboardStats
    end

    REPO-->>DASH: DashboardStats agrégées
    DASH-->>UI: AsyncData(stats)

    UI->>UI: Affiche widgets :\n- Carte "Offres actives: N"\n- Carte "Candidatures: N"\n- Carte "RETENU: N / REFUSÉ: N"\n- Carte "Nouveaux CVs: N"

    RH->>UI: Pull-to-refresh (swipe bas)
    UI->>DASH: ref.invalidate(dashboardStatsProvider)
    Note over DASH: FutureProvider rebuild\n→ rechargement depuis API
    DASH-->>UI: Nouvelles données affichées
```

---

## 3. Consultation et prise de décision matching (mobile)

```mermaid
sequenceDiagram
    actor RH as Responsable RH
    participant UI as MatchingResultsScreen\n(ConsumerWidget)
    participant PROV as matchingResultsProvider(offerId)\nFutureProvider.autoDispose.family
    participant REPO as MatchingRepository
    participant DIO as Dio + _AuthInterceptor
    participant API as FastAPI :8000
    participant DB as PostgreSQL

    Note over UI: Route: /offers/:id/matching\n(hors ShellRoute — pas de BottomNav)

    RH->>UI: Navigation vers /offers/42/matching

    UI->>PROV: ref.watch(matchingResultsProvider(42))
    PROV->>REPO: getResults(offerId: 42)
    REPO->>DIO: GET /api/rh/offers/42/matching\n?limit=50&skip=0
    DIO->>API: GET /api/rh/offers/42/matching
    API->>DB: SELECT resultats JOIN cvs JOIN candidates\nWHERE id_offre=42\nORDER BY rang
    DB-->>API: [Resultat × N]
    API-->>DIO: {total, resultats: [{id, cv_id,\ncandidate_nom, score_final,\nscore_matching, score_skills,\nscore_experience, score_langue,\nrang, decision}]}
    DIO-->>REPO: MatchingResponse
    REPO-->>PROV: MatchingResponse
    PROV-->>UI: AsyncData(MatchingResponse)

    UI->>UI: Affiche liste triée par rang\nChaque item : ScoreRing + nom + DecisionBadge

    RH->>UI: Swipe ou tape sur un résultat
    UI->>UI: Ouvre BottomSheet\n(formulaire décision)

    RH->>UI: Choisit RETAINED\nSaisit feedback "Excellent profil"\nCoche "Visible par le candidat"

    UI->>REPO: makeDecision(\n  offerId: 42,\n  resultId: 15,\n  decision: "RETAINED",\n  feedbackRh: "Excellent profil",\n  feedbackVisible: true\n)
    REPO->>DIO: PATCH /api/rh/offers/42/matching/15\n{decision, feedback_rh, feedback_visible}
    DIO->>API: PATCH (+ Bearer token)
    API->>DB: UPDATE resultats SET\ndecision=RETAINED,\nfeedback_rh=?,\nfeedback_visible=true,\ndate_decision=NOW()
    DB-->>API: OK
    API-->>DIO: HTTP 200 {id, decision: RETAINED, rang, score_final, ...}
    DIO-->>REPO: Resultat mis à jour
    REPO-->>UI: Succès

    UI->>UI: Ferme BottomSheet
    UI->>PROV: ref.invalidate(matchingResultsProvider(42))
    Note over PROV: autoDispose rebuild\nrechargement depuis API

    PROV-->>UI: Liste rafraîchie\n(badge RETENU visible en vert)
```

---

## 4. Synchronisation après mutation — Invalidation Riverpod en cascade

Ce diagramme montre le mécanisme de synchronisation automatique après toute mutation (décision, création d'offre, etc.).

```mermaid
sequenceDiagram
    participant UI as Écran Flutter\n(ConsumerWidget)
    participant REPO as Repository
    participant DIO as Dio
    participant API as FastAPI :8000
    participant PROV_M as matchingResultsProvider(id)\nFutureProvider.autoDispose.family
    participant PROV_D as dashboardStatsProvider\nFutureProvider
    participant PROV_O as offersProvider\nFutureProvider.autoDispose

    Note over UI: Exemple : RH prend une décision\nPATCH /matching/:id

    UI->>REPO: makeDecision(offerId, resultId, "RETAINED")
    REPO->>DIO: PATCH /api/rh/offers/{id}/matching/{rid}
    DIO->>API: PATCH (Bearer token)
    API-->>DIO: HTTP 200 {decision: RETAINED}
    DIO-->>REPO: Resultat
    REPO-->>UI: Succès

    rect rgb(255, 243, 205)
        Note over UI: Invalidation en cascade (ref.invalidate)
        UI->>PROV_M: ref.invalidate(matchingResultsProvider(offerId))
        UI->>PROV_D: ref.invalidate(dashboardStatsProvider)
    end

    PROV_M->>DIO: GET /api/rh/offers/{id}/matching (rebuild)
    DIO->>API: GET (Bearer token)
    API-->>DIO: Données mises à jour
    DIO-->>PROV_M: MatchingResponse
    PROV_M-->>UI: AsyncData → UI rebuild automatique\n(badge RETENU visible)

    PROV_D->>DIO: GET /api/rh/dashboard/stats (rebuild)
    DIO->>API: GET (Bearer token)
    API-->>DIO: Stats mises à jour\n(retained+1 dans les compteurs)
    DIO-->>PROV_D: DashboardStats
    PROV_D-->>UI: AsyncData → DashboardScreen\nmis à jour si visible

    Note over UI,API: Aucun état local ne persiste après mutation :\n- Pas de cache optimiste\n- Source de vérité = API\n- UI toujours cohérente avec le backend
```

---

## 5. Gestion de la navigation hors-shell (détail sans BottomNav)

```mermaid
sequenceDiagram
    actor RH as Responsable RH
    participant SHELL as AppShell\n(ShellRoute)\n[Dashboard|Offers|CVthèque|Calendrier]
    participant ROUTER as GoRouter
    participant OFF as OffersScreen\n(dans Shell)
    participant DET as OfferDetailScreen\n(hors Shell)
    participant MATCH as MatchingResultsScreen\n(hors Shell)

    RH->>SHELL: Tape onglet "Offers"
    SHELL->>OFF: Affiche OffersScreen\n(/offers — dans ShellRoute)

    OFF->>OFF: Liste les offres\n(ref.watch(offersProvider))

    RH->>OFF: Tape sur une offre (id=42)
    OFF->>ROUTER: context.push('/offers/42')

    Note over ROUTER: /offers/:id est HORS ShellRoute\n(pas de BottomNavigationBar)
    ROUTER->>DET: Affiche OfferDetailScreen(offerId: 42)\nAvec bouton retour ← en haut

    RH->>DET: Tape "Voir le matching"
    DET->>ROUTER: context.push('/offers/42/matching')
    ROUTER->>MATCH: Affiche MatchingResultsScreen(offerId: 42)\n(toujours hors Shell, bouton ←)

    RH->>MATCH: Appuie sur ←
    MATCH->>ROUTER: Navigator.pop()
    ROUTER->>DET: Retour OfferDetailScreen

    RH->>DET: Appuie sur ←
    DET->>ROUTER: Navigator.pop()
    ROUTER->>OFF: Retour OffersScreen\n(dans ShellRoute avec BottomNav)

    Note over SHELL: AppShell reaffiche la BottomNavigationBar\n(onglet "Offers" toujours sélectionné)
```
