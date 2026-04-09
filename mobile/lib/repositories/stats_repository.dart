import '../core/api_client.dart';
import '../models/dashboard_stats.dart';

class StatsRepository {
  /// GET /api/rh/dashboard — returns RH dashboard statistics
  Future<DashboardStats> getDashboardStats() async {
    final response = await dio.get('/api/rh/dashboard');
    return DashboardStats.fromJson(response.data as Map<String, dynamic>);
  }
}
