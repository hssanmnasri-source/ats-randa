# Application Mobile RH — Flutter

## 9.1 Choix architectural : pourquoi RH-only

### Cas d'usage identifiés

L'application mobile cible spécifiquement les **Responsables RH** pour plusieurs raisons :

1. **Décisions en déplacement** : un RH peut recevoir de nouvelles candidatures ou devoir valider un résultat de matching lors d'une réunion, d'un déplacement ou d'un salon de recrutement. L'accès mobile permet d'agir sans attendre un ordinateur.

2. **Consultation du calendrier** : la planification des entretiens est une activité fréquente qui bénéficie d'une interface tactile optimisée pour les calendriers.

3. **Notifications et alertes** : les alertes de seuil (nouveau lot de candidatures) sont plus pertinentes sur mobile.

4. **Portail candidat déjà accessible sur mobile** : le portail web React est responsive et accessible depuis n'importe quel navigateur mobile. Développer une application native candidate serait redondant.

5. **Réduction de la surface de sécurité** : limiter l'app mobile au rôle RH réduit la complexité de l'authentification et les risques associés à l'exposition des données candidat sur des appareils personnels.

### Portée fonctionnelle mobile

L'application couvre l'intégralité des fonctionnalités RH du portail web :
- Tableau de bord avec statistiques en temps réel
- Gestion des offres (CRUD complet)
- Résultats de matching avec scores détaillés (4 critères)
- Prise de décision RETENU / REFUSÉ avec feedback
- Consultation des candidatures avec filtres par statut
- CVthèque avec recherche
- Calendrier des entretiens

---

## 9.2 Architecture technique

### Stack Flutter

| Composant | Bibliothèque | Version | Rôle |
|-----------|-------------|---------|------|
| Gestion d'état | `flutter_riverpod` | 2.x | Providers réactifs et testables |
| Navigation | `go_router` | 12.x | Routage déclaratif avec redirections auth |
| Client HTTP | `dio` | 5.x | Requêtes REST + intercepteur JWT |
| Stockage sécurisé | `flutter_secure_storage` | 9.x | Token JWT chiffré au niveau OS |
| Modèles | `freezed` + `json_serializable` | — | Immutabilité + sérialisation JSON |
| UI | Material Design 3 | — | Composants natifs avec seedColor |

### Structure des fichiers

```
mobile/lib/
├── core/
│   ├── api_client.dart      ← Singleton Dio + _AuthInterceptor + helpers token
│   └── theme.dart           ← kPrimary, kGold, kGoldLight, kDarkBrown + buildAppTheme()
│
├── models/                  ← Modèles Freezed + JSON :
│   ├── rh_user.dart         ← Utilisateur RH connecté
│   ├── job_offer.dart       ← Offre d'emploi
│   ├── matching_result.dart ← Résultat de matching (4 scores + décision)
│   ├── cv_summary.dart      ← Résumé CV pour la CVthèque
│   ├── calendar_event.dart  ← Entretien planifié
│   └── dashboard_stats.dart ← Statistiques tableau de bord
│
├── repositories/            ← Couche API (appels HTTP directs) :
│   ├── auth_repository.dart
│   ├── offers_repository.dart
│   ├── matching_repository.dart
│   ├── cvs_repository.dart
│   └── stats_repository.dart
│
├── providers/               ← Couche Riverpod :
│   ├── auth_provider.dart          ← authStateProvider (AsyncNotifier<User?>)
│   ├── offers_provider.dart        ← offersProvider (FutureProvider.autoDispose)
│   ├── matching_provider.dart      ← matchingResultsProvider(offerId)
│   ├── cv_provider.dart            ← cvListProvider
│   ├── dashboard_provider.dart     ← dashboardStatsProvider
│   └── calendar_provider.dart      ← calendarEventsProvider
│
├── ui/
│   ├── screens/             ← Écrans principaux :
│   │   ├── login_screen.dart
│   │   ├── dashboard_screen.dart
│   │   ├── offers_screen.dart
│   │   ├── offer_detail_screen.dart
│   │   ├── matching_screen.dart
│   │   ├── applications_screen.dart
│   │   ├── cvtheque_screen.dart
│   │   └── calendar_screen.dart
│   └── widgets/             ← Composants réutilisables :
│       ├── app_shell.dart          ← BottomNavigationBar (5 onglets)
│       ├── score_ring.dart         ← Indicateur circulaire de score
│       ├── decision_badge.dart     ← Badge RETENU/REFUSÉ/EN ATTENTE
│       └── offer_card.dart         ← Carte offre d'emploi
│
├── router.dart              ← Configuration GoRouter + redirections auth
└── main.dart                ← ProviderScope → AtsRandaApp → MaterialApp.router
```

### Riverpod : gestion d'état

**`authStateProvider`** est un `AsyncNotifierProvider<User?>` qui :
- Restaure la session au démarrage (lecture du token dans `flutter_secure_storage`).
- Expose les méthodes `login()` et `logout()`.
- Notifie GoRouter de tout changement d'état (connexion/déconnexion).

**Tous les autres providers** utilisent `FutureProvider.autoDispose` :
- Les données sont automatiquement libérées à la fermeture de l'écran.
- `keepAlive()` peut être appelé pour conserver les données critiques (liste des offres).
- Le paramètre `.autoDispose` garantit qu'à chaque navigation vers un écran, les données sont rechargées depuis l'API.

### Client HTTP Dio

```dart
// core/api_client.dart
class ApiClient {
  static final Dio _dio = Dio(BaseOptions(
    baseUrl: String.fromEnvironment('API_URL', defaultValue: 'http://localhost:8000'),
    headers: {'Content-Type': 'application/json'},
  ))..interceptors.add(_AuthInterceptor());

  static Future<void> saveTokens(String accessToken) async {
    await _storage.write(key: 'access_token', value: accessToken);
  }

  static Future<void> clearTokens() async {
    await _storage.delete(key: 'access_token');
  }
}

class _AuthInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final token = await _storage.read(key: 'access_token');
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }
}
```

Le token est ajouté automatiquement à toutes les requêtes via l'intercepteur. Une réponse `401` déclenche un appel à `authStateProvider.logout()` via le handler d'erreur.

---

## 9.3 Navigation avec GoRouter

### Structure de routage

```dart
// router.dart
final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    refreshListenable: _AuthChangeNotifier(ref),
    redirect: (context, state) {
      final user = ref.read(authStateProvider).valueOrNull;
      final isLoggedIn = user != null;
      final isLoginRoute = state.matchedLocation == '/login';
      
      if (!isLoggedIn && !isLoginRoute) return '/login';
      if (isLoggedIn && isLoginRoute) return '/dashboard';
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (_,__) => const LoginScreen()),
      ShellRoute(
        builder: (_, __, child) => AppShell(child: child),
        routes: [
          GoRoute(path: '/dashboard', ...),
          GoRoute(path: '/offers', ...),
          GoRoute(path: '/matching', ...),
          GoRoute(path: '/applications', ...),
          GoRoute(path: '/cvtheque', ...),
        ],
      ),
      // Routes détail HORS shell (sans BottomNav)
      GoRoute(path: '/offers/:id', ...),
      GoRoute(path: '/offers/:id/matching', ...),
      GoRoute(path: '/calendar', ...),
    ],
  );
});
```

**ShellRoute** : les 5 onglets principaux sont imbriqués dans `AppShell` qui affiche la barre de navigation inférieure. Les routes détail (`/offers/:id`, `/calendar`) sont définies en dehors du shell — elles s'affichent sans barre de navigation, avec un bouton retour.

**`_AuthChangeNotifier`** : écoute `authStateProvider` via `ref.listen` et appelle `notifyListeners()` à chaque changement d'état d'authentification, déclenchant la réévaluation de la fonction `redirect` par GoRouter.

---

## 9.4 Fonctionnalités implémentées

### Tableau de bord RH

`DashboardScreen` affiche des statistiques agrégées depuis `dashboardStatsProvider` :
- Nombre total de candidatures (RETENU / EN ATTENTE / REFUSÉ)
- Nombre d'offres actives
- CVs indexés dans la semaine

Les statistiques sont chargées en deux appels parallèles (profil + stats) combinés dans `stats_repository.dart`.

### Gestion des offres

`OffersScreen` liste les offres avec un champ de recherche. La recherche est gérée par `offersSearchQueryProvider` (`StateProvider<String>`) observé par `offersProvider` — la liste se met à jour en temps réel lors de la saisie.

Chaque offre est présentée dans une `OfferCard` avec statut coloré. La navigation vers `OfferDetailScreen` permet de voir les détails et de naviguer vers les résultats de matching.

### Matching et décisions

`MatchingScreen` charge les résultats via `matchingResultsProvider(offerId)`. Chaque résultat affiche :
- `ScoreRing` : indicateur circulaire du score final (couleur selon le seuil)
- Décomposition des 4 sous-scores (sémantique, compétences, expérience, langue)
- `DecisionBadge` : RETENU (vert), EN ATTENTE (orange), REFUSÉ (rouge)

Le RH peut prendre une décision directement depuis la liste via un bottom sheet, saisir un feedback et choisir si ce feedback est visible par le candidat.

### Candidatures avec filtres

`ApplicationsScreen` affiche toutes les candidatures avec filtres par décision. Chaque candidature peut être consultée en détail via un écran dédié.

### CVthèque avec recherche

`CVthequeScreen` permet de parcourir tous les CVs indexés avec filtres. La recherche est déclenchée après un délai de 300 ms (debounce) pour éviter les requêtes à chaque frappe.

### Calendrier des entretiens

`CalendarScreen` affiche les entretiens planifiés. Les données sont récupérées via `calendarEventsProvider` qui interroge `GET /api/rh/calendar`.

---

## 9.5 Synchronisation temps réel

### Stratégie autoDispose

```dart
// Chaque provider se réinitialise à la fermeture de l'écran
final offersProvider = FutureProvider.autoDispose((ref) async {
  return await OffersRepository.getOffers();
});
```

À chaque navigation vers `OffersScreen`, le provider recharge les données depuis l'API. Il n'y a pas de cache statique qui pourrait désynchroniser l'affichage.

### Invalidation après mutation

Après une mutation (décision, feedback, création d'offre), les providers concernés sont invalidés :

```dart
// Après PATCH /matching/{result_id}
ref.invalidate(matchingResultsProvider(offerId));
ref.invalidate(dashboardStatsProvider);
```

Cette invalidation force un rechargement depuis l'API, garantissant la cohérence avec le backend.

### Pull-to-refresh

Tous les écrans avec listes supportent le pull-to-refresh via `RefreshIndicator` :

```dart
RefreshIndicator(
  onRefresh: () async => ref.invalidate(offersProvider),
  child: ListView(...)
)
```

---

## 9.6 Charte graphique mobile

La charte graphique est identique au portail web, définie dans `core/theme.dart` :

```dart
const Color kPrimary   = Color(0xFF8B1A1A);  // Rouge foncé — boutons, liens
const Color kGold      = Color(0xFFC9A84C);  // Or — accents
const Color kGoldLight = Color(0xFFF0D080);  // Or clair — fonds
const Color kDarkBrown = Color(0xFF3D0C02);  // Brun foncé — en-têtes, AppBar

ThemeData buildAppTheme() => ThemeData(
  useMaterial3: true,
  colorScheme: ColorScheme.fromSeed(
    seedColor: kPrimary,
    brightness: Brightness.light,
  ),
  appBarTheme: AppBarTheme(
    backgroundColor: kDarkBrown,
    foregroundColor: Colors.white,
  ),
  ...
);
```

Toutes les références de couleur dans les écrans importent uniquement depuis `theme.dart` — aucune couleur hexadécimale n'est codée directement dans les widgets.

---

## 9.7 URL de l'API backend

L'URL de l'API est configurée via une variable de compilation (`--dart-define`) :

```bash
# Web / Windows (développement local)
flutter run -d chrome
# → utilise http://localhost:8000 (valeur par défaut)

# Émulateur Android
flutter run -d emulator-5554 --dart-define=API_URL=http://10.0.2.2:8000
# → 10.0.2.2 est l'alias de l'hôte depuis l'émulateur Android

# Appareil physique sur le même réseau Wi-Fi
flutter run --dart-define=API_URL=http://192.168.1.x:8000
```

Cette approche évite de modifier le code source pour changer d'environnement.

---

## 9.8 Génération des modèles Freezed

Après toute modification d'un modèle Dart (ajout de champ, changement de type), régénérer les fichiers générés :

```bash
cd mobile
dart run build_runner build --delete-conflicting-outputs
```

Cette commande génère les fichiers `.freezed.dart` (copie immuable, pattern matching) et `.g.dart` (fromJson/toJson) à partir des annotations `@freezed` et `@JsonSerializable`.

Les fichiers générés sont committés dans le dépôt Git (ils font partie de la version de production).
