import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'core/api_client.dart';
import 'providers/auth_provider.dart';
import 'ui/screens/login_screen.dart';
import 'ui/screens/dashboard_screen.dart';
import 'ui/screens/offers_screen.dart';
import 'ui/screens/offer_detail_screen.dart';
import 'ui/screens/offer_form_screen.dart';
import 'ui/screens/matching_results_screen.dart';
import 'ui/screens/cvtheque_screen.dart';
import 'ui/screens/cv_detail_screen.dart';
import 'ui/screens/calendar_screen.dart';
import 'ui/widgets/app_shell.dart';

class _AuthChangeNotifier extends ChangeNotifier {
  _AuthChangeNotifier(Ref ref) {
    ref.listen(authStateProvider, (_, __) => notifyListeners());
  }
}

final routerProvider = Provider<GoRouter>((ref) {
  final authNotifier = _AuthChangeNotifier(ref);

  final router = GoRouter(
    initialLocation: '/dashboard',
    refreshListenable: authNotifier,
    redirect: (context, state) {
      final auth = ref.read(authStateProvider);
      if (auth.isLoading) return null;

      final isLoggedIn = auth.valueOrNull != null;
      final loc = state.matchedLocation;
      final isPublic = loc == '/login';

      if (!isLoggedIn && !isPublic) return '/login';
      if (isLoggedIn && isPublic) return '/dashboard';
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (_, __) => const LoginScreen(),
      ),
      ShellRoute(
        builder: (_, __, child) => AppShell(child: child),
        routes: [
          GoRoute(
            path: '/dashboard',
            builder: (_, __) => const DashboardScreen(),
          ),
          GoRoute(
            path: '/offers',
            builder: (_, __) => const OffersScreen(),
          ),
          GoRoute(
            path: '/cvtheque',
            builder: (_, __) => const CvthequeScreen(),
          ),
          GoRoute(
            path: '/calendar',
            builder: (_, __) => const CalendarScreen(),
          ),
        ],
      ),
      // Detail routes outside shell (no bottom nav)
      GoRoute(
        path: '/offers/create',
        builder: (_, __) => const OfferFormScreen(),
      ),
      GoRoute(
        path: '/offers/:id',
        builder: (_, state) => OfferDetailScreen(
          offerId: int.parse(state.pathParameters['id']!),
        ),
      ),
      GoRoute(
        path: '/offers/:id/edit',
        builder: (_, state) => OfferFormScreen(
          offerId: int.parse(state.pathParameters['id']!),
        ),
      ),
      GoRoute(
        path: '/offers/:id/matching',
        builder: (_, state) => MatchingResultsScreen(
          offerId: int.parse(state.pathParameters['id']!),
        ),
      ),
      GoRoute(
        path: '/cvtheque/:id',
        builder: (_, state) => CvDetailScreen(
          cvId: int.parse(state.pathParameters['id']!),
        ),
      ),
    ],
  );

  initApiClient(router);

  ref.onDispose(() {
    router.dispose();
    authNotifier.dispose();
  });

  return router;
});
