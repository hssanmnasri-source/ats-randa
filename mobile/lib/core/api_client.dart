import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:go_router/go_router.dart';

// Android emulator: 10.0.2.2 maps to host machine's localhost
// iOS simulator / Web / Windows desktop: use localhost
// Physical device: use your machine's LAN IP (e.g. 192.168.x.x)
const _baseUrl = String.fromEnvironment('API_URL', defaultValue: 'http://localhost:8000');

const _storage = FlutterSecureStorage();

late GoRouter _router;

void initApiClient(GoRouter router) {
  _router = router;
}

final dio = Dio(
  BaseOptions(
    baseUrl: _baseUrl,
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 15),
    headers: {'Content-Type': 'application/json'},
  ),
)
  ..interceptors.add(_AuthInterceptor())
  ..interceptors.add(LogInterceptor(requestBody: true, responseBody: false));

class _AuthInterceptor extends Interceptor {
  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _storage.read(key: 'access_token');
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    if (err.response?.statusCode == 401) {
      await _storage.delete(key: 'access_token');
      await _storage.delete(key: 'refresh_token');
      _router.go('/login');
    }
    handler.next(err);
  }
}

/// Save tokens after successful login
Future<void> saveTokens({
  required String accessToken,
  String? refreshToken,
}) async {
  await _storage.write(key: 'access_token', value: accessToken);
  if (refreshToken != null) {
    await _storage.write(key: 'refresh_token', value: refreshToken);
  }
}

/// Clear stored tokens on logout
Future<void> clearTokens() async {
  await _storage.delete(key: 'access_token');
  await _storage.delete(key: 'refresh_token');
}

/// Check if a token is currently stored
Future<bool> hasToken() async {
  final token = await _storage.read(key: 'access_token');
  return token != null && token.isNotEmpty;
}
