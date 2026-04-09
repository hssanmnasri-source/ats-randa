import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme.dart';
import '../../models/dashboard_stats.dart';
import '../../providers/auth_provider.dart';
import '../../providers/dashboard_provider.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authStateProvider).valueOrNull;
    final statsAsync = ref.watch(dashboardStatsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Tableau de bord'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Déconnexion',
            onPressed: () async {
              await ref.read(authStateProvider.notifier).logout();
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(dashboardStatsProvider),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Greeting card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: kDarkBrown,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Bonjour, ${user?.prenom.isNotEmpty == true ? user!.prenom : user?.email ?? ''}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    user?.email ?? '',
                    style: TextStyle(color: Colors.white.withValues(alpha: 0.7), fontSize: 13),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Stats grid
            statsAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(
                child: Text('Erreur : $e', style: const TextStyle(color: Colors.red)),
              ),
              data: (stats) => _StatsGrid(stats: stats),
            ),

            const SizedBox(height: 24),

            // Quick actions
            const Text(
              'Actions rapides',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    icon: const Icon(Icons.add),
                    label: const Text('Nouvelle offre'),
                    onPressed: () => context.go('/offers/create'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    icon: const Icon(Icons.work, color: kPrimary),
                    label: const Text('Voir offres',
                        style: TextStyle(color: kPrimary)),
                    onPressed: () => context.go('/offers'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _StatsGrid extends StatelessWidget {
  final DashboardStats stats;
  const _StatsGrid({required this.stats});

  @override
  Widget build(BuildContext context) {
    final items = [
      (label: 'Mes offres', value: '${stats.myTotalOffers}', icon: Icons.work),
      (label: 'Offres actives', value: '${stats.myActiveOffers}', icon: Icons.check_circle),
      (label: 'Total candidats', value: '${stats.totalCandidates}', icon: Icons.people),
      (label: 'CVs indexés', value: '${stats.totalCvs}', icon: Icons.description),
      (label: 'Nvx CVs (7j)', value: '${stats.newCvs7Days}', icon: Icons.new_releases),
      (label: 'Total offres', value: '${stats.totalOffers}', icon: Icons.list_alt),
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1.4,
      ),
      itemCount: items.length,
      itemBuilder: (_, i) {
        final item = items[i];
        return Container(
          decoration: BoxDecoration(
            border: Border.all(color: kGold.withValues(alpha: 0.4)),
            borderRadius: BorderRadius.circular(12),
            color: Colors.white,
          ),
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Icon(item.icon, color: kGold, size: 20),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.value,
                    style: const TextStyle(
                      color: kPrimary,
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(item.label,
                      style: const TextStyle(
                          color: Colors.grey, fontSize: 11)),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}
