import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'core/api_client.dart';
import 'providers/auth_provider.dart';

// ── RH screens ────────────────────────────────────────────────────────────────
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

// ── Candidate screens ─────────────────────────────────────────────────────────
import 'ui/screens/candidate/candidate_dashboard_screen.dart';
import 'ui/screens/candidate/candidate_offers_screen.dart';
import 'ui/screens/candidate/candidate_offer_detail_screen.dart';
import 'ui/screens/candidate/candidate_applications_screen.dart';
import 'ui/screens/candidate/candidate_application_detail_screen.dart';
import 'ui/screens/candidate/candidate_profile_screen.dart';
import 'ui/screens/candidate/candidate_cvs_screen.dart';
import 'ui/screens/candidate/candidate_cover_letters_screen.dart';
import 'ui/widgets/candidate_shell.dart';

class _AuthChangeNotifier extends ChangeNotifier {
  _AuthChangeNotifier(Ref ref) {
    ref.listen(authStateProvider, (_, __) => notifyListeners());
  }
}

final routerProvider = Provider<GoRouter>((ref) {
  final authNotifier = _AuthChangeNotifier(ref);

  final router = GoRouter(
    initialLocation: '/login',
    refreshListenable: authNotifier,
    redirect: (context, state) {
      final auth = ref.read(authStateProvider);
      if (auth.isLoading) return null;

      final user = auth.valueOrNull;
      final isLoggedIn = user != null;
      final loc = state.matchedLocation;
      final isPublic = loc == '/login';

      // Not logged in → always go to login
      if (!isLoggedIn && !isPublic) return '/login';

      // Logged in on login page → redirect to role home
      if (isLoggedIn && isPublic) {
        return user.role.toLowerCase() == 'candidate'
            ? '/candidate/dashboard'
            : '/dashboard';
      }

      // Candidate trying to access RH routes → redirect to candidate home
      if (isLoggedIn &&
          user.role.toLowerCase() == 'candidate' &&
          !loc.startsWith('/candidate') &&
          loc != '/login') {
        return '/candidate/dashboard';
      }

      // RH trying to access candidate routes → redirect to RH home
      if (isLoggedIn &&
          user.role.toLowerCase() == 'rh' &&
          loc.startsWith('/candidate')) {
        return '/dashboard';
      }

      return null;
    },
    routes: [
      // ── Public ─────────────────────────────────────────────────────────────
      GoRoute(
        path: '/login',
        builder: (_, __) => const LoginScreen(),
      ),

      // ── RH shell ───────────────────────────────────────────────────────────
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
      // RH detail routes (no shell)
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

      // ── Candidate shell ────────────────────────────────────────────────────
      ShellRoute(
        builder: (_, __, child) => CandidateShell(child: child),
        routes: [
          GoRoute(
            path: '/candidate/dashboard',
            builder: (_, __) => const CandidateDashboardScreen(),
          ),
          GoRoute(
            path: '/candidate/offers',
            builder: (_, __) => const CandidateOffersScreen(),
          ),
          GoRoute(
            path: '/candidate/applications',
            builder: (_, __) => const CandidateApplicationsScreen(),
          ),
          GoRoute(
            path: '/candidate/profile',
            builder: (_, __) => const CandidateProfileScreen(),
          ),
        ],
      ),
      // Candidate detail routes (no shell)
      GoRoute(
        path: '/candidate/offers/:id',
        builder: (_, state) => CandidateOfferDetailScreen(
          offerId: int.parse(state.pathParameters['id']!),
        ),
      ),
      GoRoute(
        path: '/candidate/applications/:id',
        builder: (_, state) => CandidateApplicationDetailScreen(
          applicationId: int.parse(state.pathParameters['id']!),
        ),
      ),
      GoRoute(
        path: '/candidate/cvs',
        builder: (_, __) => const CandidateCvsScreen(),
      ),
      GoRoute(
        path: '/candidate/cover-letters',
        builder: (_, __) => const CandidateCoverLettersScreen(),
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
