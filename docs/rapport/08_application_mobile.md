# Application Mobile — Flutter (Multi-rôle)

## 9.1 Choix architectural : application multi-rôle

### Cas d'usage identifiés

L'application mobile cible deux rôles distincts : les **Responsables RH** et les **Candidats**.

**RH — décisions en déplacement :**
Un RH peut recevoir de nouvelles candidatures ou devoir valider un résultat de matching lors d'une réunion, d'un déplacement ou d'un salon de recrutement. L'accès mobile permet d'agir sans attendre un ordinateur.

**Candidats — suivi de candidature en temps réel :**
Le candidat consulte l'état de ses candidatures, parcourt les offres actives, gère son profil et ses CVs depuis son téléphone. La timeline de traitement (POSTULÉ → ANALYSE IA → EN EXAMEN → DÉCISION) est particulièrement adaptée à un affichage mobile.

**Portail web toujours disponible :**
Le portail React reste accessible sur mobile via navigateur pour les deux rôles. L'application native apporte une expérience optimisée et la persistance de session.

### Portée fonctionnelle

| Fonctionnalité | RH | Candidat |
|---|---|---|
| Tableau de bord avec statistiques | ✓ | ✓ |
| Gestion des offres (CRUD) | ✓ | — |
| Parcours des offres publiques | — | ✓ |
| Matching et décisions (RETENU/REFUSÉ) | ✓ | — |
| CVthèque avec recherche sémantique | ✓ | — |
| Gestion des candidatures | — | ✓ (timeline) |
| Calendrier des entretiens | ✓ | — |
| Profil, CVs, lettres de motivation | — | ✓ |

---

## 9.2 Architecture technique

### Stack Flutter

| Composant | Bibliothèque | Version | Rôle |
|-----------|-------------|---------|------|
| Gestion d'état | `flutter_riverpod` | 2.x | Providers réactifs et testables |
| Navigation | `go_router` | 12.x | Routage déclaratif avec redirections auth + rôle |
| Client HTTP | `dio` | 5.x | Requêtes REST + intercepteur JWT |
| Stockage sécurisé | `flutter_secure_storage` | 9.x | Token JWT chiffré au niveau OS |
| Modèles RH | `freezed` + `json_serializable` | — | Immutabilité + sérialisation JSON |
| Modèles candidat | Classes Dart simples | — | `fromJson` + `copyWith` manuels |
| UI | Material Design 3 | — | Composants natifs avec seedColor |

### Structure des fichiers

```
mobile/lib/
├── core/
│   ├── api_client.dart        ← Singleton Dio + _AuthInterceptor + saveTokens/clearTokens/hasToken
│   └── theme.dart             ← kPrimary, kGold, kGoldLight, kDarkBrown + buildAppTheme()
│
├── models/
│   ├── rh_user.dart           ← Freezed — utilisateur connecté (RH ou candidat), champ `role`
│   ├── job_offer.dart         ← Freezed — offre d'emploi (vue RH)
│   ├── matching_result.dart   ← Freezed — résultat de matching (4 scores + décision)
│   ├── cv_summary.dart        ← Freezed — résumé CV pour la CVthèque RH
│   ├── calendar_event.dart    ← Freezed — entretien planifié
│   ├── dashboard_stats.dart   ← Classe simple — statistiques tableau de bord RH
│   ├── public_offer.dart      ← Classe simple — offre publique (vue candidat)
│   ├── candidate_profile.dart ← Classe simple — CandidateProfile, FullProfile, Experience, Skill
│   ├── candidate_cv.dart      ← Classe simple — CV du candidat
│   ├── application.dart       ← Classe simple — Application, ApplicationDetail, TimelineStep
│   └── cover_letter.dart      ← Classe simple — lettre de motivation
│
├── repositories/              ← Couche API (appels HTTP directs) :
│   ├── auth_repository.dart
│   ├── offers_repository.dart
│   ├── matching_repository.dart
│   ├── cv_repository.dart
│   ├── stats_repository.dart
│   ├── calendar_repository.dart
│   ├── candidate_offer_repository.dart
│   ├── candidate_application_repository.dart
│   ├── candidate_profile_repository.dart
│   ├── candidate_cv_repository.dart
│   └── candidate_cover_letter_repository.dart
│
├── providers/                 ← Couche Riverpod :
│   ├── auth_provider.dart                   ← authStateProvider (AsyncNotifier<RhUser?>)
│   ├── offers_provider.dart                 ← offersProvider, offersStatusFilterProvider
│   ├── matching_provider.dart               ← matchingResultsProvider(offerId)
│   ├── cv_provider.dart                     ← cvthequeProvider, cvSearchQueryProvider
│   ├── dashboard_provider.dart              ← dashboardStatsProvider
│   ├── calendar_provider.dart               ← calendarEventsProvider
│   ├── candidate_offer_provider.dart        ← candidateOffersProvider, candidateOfferSearchProvider
│   ├── candidate_application_provider.dart  ← candidateApplicationsProvider, applicationDetailProvider
│   ├── candidate_profile_provider.dart      ← fullProfileProvider, candidateProfileProvider
│   ├── candidate_cv_provider.dart           ← candidateCvsProvider
│   └── candidate_cover_letter_provider.dart ← coverLettersProvider
│
├── ui/
│   ├── screens/               ← Écrans RH :
│   │   ├── login_screen.dart
│   │   ├── dashboard_screen.dart
│   │   ├── offers_screen.dart
│   │   ├── offer_detail_screen.dart
│   │   ├── offer_form_screen.dart
│   │   ├── matching_results_screen.dart
│   │   ├── cvtheque_screen.dart
│   │   ├── cv_detail_screen.dart
│   │   ├── calendar_screen.dart
│   │   └── candidate/         ← Écrans candidat :
│   │       ├── candidate_dashboard_screen.dart
│   │       ├── candidate_offers_screen.dart
│   │       ├── candidate_offer_detail_screen.dart
│   │       ├── candidate_applications_screen.dart
│   │       ├── candidate_application_detail_screen.dart
│   │       ├── candidate_profile_screen.dart
│   │       ├── candidate_cvs_screen.dart
│   │       └── candidate_cover_letters_screen.dart
│   └── widgets/               ← Composants réutilisables :
│       ├── app_shell.dart          ← BottomNav RH (4 onglets)
│       ├── candidate_shell.dart    ← BottomNav candidat (4 onglets)
│       ├── score_ring.dart         ← Indicateur circulaire de score (vert/orange/rouge)
│       ├── status_badge.dart       ← Badge de statut contextuel (partagé)
│       ├── offer_card.dart         ← Carte offre d'emploi
│       └── cv_card.dart            ← Carte résumé CV
│
├── router.dart  ← routerProvider : deux ShellRoutes + _AuthChangeNotifier + redirect par rôle
└── main.dart    ← ProviderScope → AtsRandaApp → MaterialApp.router
```

### Stratégie Freezed vs. classes simples

Seuls les modèles RH (`RhUser`, `JobOffer`, `MatchingResult`, `CvSummary`, `CalendarEvent`) utilisent `freezed`. Les modèles candidat sont des classes Dart simples avec `fromJson` et `copyWith` manuels. Ce choix évite la dépendance au générateur de code pour la partie candidat, plus susceptible d'évoluer rapidement.

Après toute modification d'un modèle Freezed, régénérer les fichiers :

```bash
cd mobile
dart run build_runner build --delete-conflicting-outputs
```

---

## 9.3 Navigation avec GoRouter

### Architecture deux-rôles

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
      if (isLoggedIn && isLoginRoute) {
        return user.role == 'rh' ? '/dashboard' : '/candidate/dashboard';
      }
      // Bloc cross-rôle : un candidat ne peut pas accéder aux routes RH
      if (user?.role == 'candidate' && state.matchedLocation.startsWith('/dashboard')) {
        return '/candidate/dashboard';
      }
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (_,__) => const LoginScreen()),

      // Shell RH — 4 onglets avec AppShell
      ShellRoute(
        builder: (_, __, child) => AppShell(child: child),
        routes: [
          GoRoute(path: '/dashboard', ...),
          GoRoute(path: '/offers', ...),
          GoRoute(path: '/cvtheque', ...),
          GoRoute(path: '/calendar', ...),
        ],
      ),
      // Routes détail RH (sans BottomNav)
      GoRoute(path: '/offers/:id', ...),
      GoRoute(path: '/offers/:id/edit', ...),
      GoRoute(path: '/offers/:id/matching', ...),
      GoRoute(path: '/cvtheque/:id', ...),

      // Shell candidat — 4 onglets avec CandidateShell
      ShellRoute(
        builder: (_, __, child) => CandidateShell(child: child),
        routes: [
          GoRoute(path: '/candidate/dashboard', ...),
          GoRoute(path: '/candidate/offers', ...),
          GoRoute(path: '/candidate/applications', ...),
          GoRoute(path: '/candidate/profile', ...),
        ],
      ),
      // Routes détail candidat (sans BottomNav)
      GoRoute(path: '/candidate/offers/:id', ...),
      GoRoute(path: '/candidate/applications/:id', ...),
      GoRoute(path: '/candidate/cvs', ...),
      GoRoute(path: '/candidate/cover-letters', ...),
    ],
  );
});
```

**`_AuthChangeNotifier`** : écoute `authStateProvider` via `ref.listen` et appelle `notifyListeners()` à chaque changement, déclenchant la réévaluation du `redirect` par GoRouter. Connexion et déconnexion sont ainsi automatiquement répercutées sur la navigation — aucun appel `context.go` manuel n'est nécessaire.

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

  static Future<bool> hasToken() async {
    return await _storage.read(key: 'access_token') != null;
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

Une réponse `401` déclenche un appel à `authStateProvider.logout()` via le handler d'erreur, provoquant la redirection vers `/login`.

---

## 9.4 Fonctionnalités RH

### Tableau de bord

`DashboardScreen` affiche des statistiques agrégées depuis `dashboardStatsProvider` : candidatures par statut, offres actives, CVs indexés. Les données proviennent de `GET /api/rh/dashboard`.

### Gestion des offres

`OffersScreen` liste les offres avec filtre par statut (`offersStatusFilterProvider`). `OfferFormScreen` gère la création et la modification. `OfferDetailScreen` affiche les détails complets et propose d'accéder aux résultats de matching.

### Matching et décisions

`MatchingResultsScreen` charge les résultats via `matchingResultsProvider(offerId)`. Chaque résultat affiche :
- `ScoreRing` : indicateur circulaire du score final (vert ≥ 70, orange 40–70, rouge < 40)
- Décomposition des 4 sous-scores
- `StatusBadge` : RETENU / EN ATTENTE / REFUSÉ

Le RH prend une décision via un bottom sheet, saisit un feedback et choisit si ce feedback est visible par le candidat. Après mutation : `ref.invalidate(matchingResultsProvider(offerId))` + `ref.invalidate(dashboardStatsProvider)`.

### CVthèque

`CVthequeScreen` permet la recherche sémantique parmi les CVs indexés. La requête est observée par `cvthequeProvider` via `cvSearchQueryProvider` avec un debounce de 300 ms.

### Calendrier

`CalendarScreen` affiche les entretiens via `calendarEventsProvider` → `GET /api/rh/calendar`.

---

## 9.5 Fonctionnalités Candidat

### Tableau de bord

`CandidateDashboardScreen` présente un résumé de l'activité du candidat : candidatures récentes, taux de complétion du profil.

### Parcours des offres

`CandidateOffersScreen` liste les offres publiques via `candidateOffersProvider`. La recherche textuelle est gérée par `candidateOfferSearchProvider` (`StateProvider<String>`) — changer la valeur relance automatiquement la requête API sans trigger manuel.

`CandidateOfferDetailScreen` affiche les détails d'une offre et propose le bouton "Postuler". La candidature est soumise directement via `CandidateApplicationRepository().apply(offerId)` (sans provider intermédiaire, mutation one-shot).

### Suivi des candidatures

`CandidateApplicationsScreen` liste toutes les candidatures. `CandidateApplicationDetailScreen` affiche la timeline en 4 étapes (POSTULÉ → ANALYSE IA → EN EXAMEN → DÉCISION), les scores détaillés et le feedback RH si disponible et visible.

### Profil et documents

- `CandidateProfileScreen` : modification des informations personnelles, expériences, compétences via `candidateProfileProvider` (AsyncNotifier).
- `CandidateCvsScreen` : liste et consultation des CVs uploadés.
- `CandidateCoverLettersScreen` : gestion des lettres de motivation (CRUD).

---

## 9.6 Synchronisation et état

### Stratégie autoDispose

```dart
final offersProvider = FutureProvider.autoDispose((ref) async {
  return await OffersRepository.getOffers();
});
```

À chaque navigation vers un écran, le provider se réinitialise et recharge les données depuis l'API. Il n'y a pas de cache statique.

### Invalidation après mutation

Après une mutation (décision, feedback, création d'offre), les providers concernés sont invalidés :

```dart
// Après PATCH /matching/{result_id}
ref.invalidate(matchingResultsProvider(offerId));
ref.invalidate(dashboardStatsProvider);
```

### Pull-to-refresh

Tous les écrans avec listes supportent le pull-to-refresh :

```dart
RefreshIndicator(
  onRefresh: () async => ref.invalidate(offersProvider),
  child: ListView(...)
)
```

---

## 9.7 Charte graphique

Définie dans `core/theme.dart`, identique au portail web :

```dart
const Color kPrimary   = Color(0xFF8B1A1A);  // Rouge foncé — boutons, liens
const Color kGold      = Color(0xFFC9A84C);  // Or — accents
const Color kGoldLight = Color(0xFFF0D080);  // Or clair — fonds
const Color kDarkBrown = Color(0xFF3D0C02);  // Brun foncé — AppBar, en-têtes

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
);
```

Toutes les références de couleur dans les widgets importent depuis `theme.dart` — aucune valeur hexadécimale directement dans le code UI.

---

## 9.8 Configuration et commandes

### URL de l'API backend

Configurée via `--dart-define` à la compilation :

```bash
# Web / Windows (développement local)
flutter run -d chrome
# → http://localhost:8000 (valeur par défaut)

# Émulateur Android
flutter run -d emulator-5554 --dart-define=API_URL=http://10.0.2.2:8000

# Appareil physique (réseau local)
flutter run --dart-define=API_URL=http://192.168.1.x:8000
```

### Commandes usuelles

```bash
cd mobile
flutter pub get                                            # Installer les dépendances
flutter run -d chrome                                      # Web dev (aucun émulateur requis)
flutter run                                               # Appareil ou émulateur connecté
flutter build apk                                         # APK release
flutter analyze                                           # Analyse statique (zéro issue attendu)
dart run build_runner build --delete-conflicting-outputs  # Régénérer les modèles Freezed (RH uniquement)
```

### CORS pour Flutter web

`main.py` utilise `allow_origin_regex=r"http://localhost:\d+"` — tous les ports localhost sont acceptés, ce qui couvre le port dynamique attribué par Flutter web.
