import '../core/api_client.dart';
import '../models/rh_user.dart';

class AuthRepository {
  /// Login — POST /api/visitor/login
  /// Accepts both 'rh' and 'candidate' roles.
  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await dio.post(
      '/api/visitor/login',
      data: {'email': email, 'password': password},
    );
    final data = response.data as Map<String, dynamic>;
    final role = (data['role'] as String? ?? '').toLowerCase();
    if (role != 'rh' && role != 'candidate') {
      throw Exception('Rôle non supporté : $role');
    }
    return data;
  }

  /// Fetch user info based on role after login.
  /// RH → GET /api/rh/me
  /// CANDIDATE → GET /api/candidate/profile (extracts id, email, nom, prenom)
  Future<RhUser> getProfile(String role) async {
    if (role == 'candidate') {
      final response = await dio.get('/api/candidate/profile');
      final json = response.data as Map<String, dynamic>;
      return RhUser(
        id: (json['id'] as num).toInt(),
        email: json['email'] as String? ?? '',
        nom: json['nom'] as String? ?? '',
        prenom: json['prenom'] as String? ?? '',
        role: 'candidate',
      );
    }
    // RH (default)
    final response = await dio.get('/api/rh/me');
    return RhUser.fromJson(response.data as Map<String, dynamic>);
  }
}
