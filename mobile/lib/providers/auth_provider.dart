import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api_client.dart';
import '../models/rh_user.dart';
import '../repositories/auth_repository.dart';

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(),
);

/// Auth state — null = unauthenticated, RhUser = authenticated
final authStateProvider =
    AsyncNotifierProvider<AuthNotifier, RhUser?>(() => AuthNotifier());

class AuthNotifier extends AsyncNotifier<RhUser?> {
  @override
  Future<RhUser?> build() async {
    if (await hasToken()) {
      try {
        // Role is embedded in the stored user — try RH first, then candidate.
        // We attempt RH; if it fails, the 401 interceptor handles token cleanup.
        // On resume, we re-fetch via the role stored in the last login attempt.
        // Simplified: try rh profile; if 403, try candidate profile.
        try {
          return await ref.read(authRepositoryProvider).getProfile('rh');
        } catch (_) {
          return await ref.read(authRepositoryProvider).getProfile('candidate');
        }
      } catch (_) {
        await clearTokens();
        return null;
      }
    }
    return null;
  }

  Future<void> login(String email, String password) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final data = await ref.read(authRepositoryProvider).login(email, password);
      await saveTokens(
        accessToken: data['access_token'] as String,
        refreshToken: data['refresh_token'] as String?,
      );
      final role = (data['role'] as String? ?? '').toLowerCase();
      return await ref.read(authRepositoryProvider).getProfile(role);
    });
  }

  Future<void> logout() async {
    await clearTokens();
    state = const AsyncData(null);
  }
}
