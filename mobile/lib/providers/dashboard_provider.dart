import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/dashboard_stats.dart';
import '../repositories/stats_repository.dart';

final statsRepositoryProvider = Provider<StatsRepository>(
  (ref) => StatsRepository(),
);

final dashboardStatsProvider = FutureProvider.autoDispose<DashboardStats>((ref) async {
  return ref.read(statsRepositoryProvider).getDashboardStats();
});
