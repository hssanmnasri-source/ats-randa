import '../core/api_client.dart';
import '../models/rh_user.dart';

class AuthRepository {
  /// Login — POST /api/visitor/login with {email, password} JSON body
  /// Returns {access_token, token_type, role}
  /// Throws if role != 'rh'
  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await dio.post(
      '/api/visitor/login',
      data: {'email': email, 'password': password},
    );
    final data = response.data as Map<String, dynamic>;
    final role = (data['role'] as String? ?? '').toLowerCase();
    if (role != 'rh') {
      throw Exception('Ce compte n\'est pas un compte RH');
    }
    return data;
  }

  /// GET /api/rh/me — returns current RH user info
  Future<RhUser> getProfile() async {
    final response = await dio.get('/api/rh/me');
    return RhUser.fromJson(response.data as Map<String, dynamic>);
  }
}
