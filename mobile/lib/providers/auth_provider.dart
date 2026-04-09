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
        return await ref.read(authRepositoryProvider).getProfile();
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
      await saveTokens(accessToken: data['access_token'] as String);
      return await ref.read(authRepositoryProvider).getProfile();
    });
  }

  Future<void> logout() async {
    await clearTokens();
    state = const AsyncData(null);
  }
}
