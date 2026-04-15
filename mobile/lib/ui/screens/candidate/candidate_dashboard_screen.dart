import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/candidate_profile_provider.dart';
import '../../../providers/candidate_application_provider.dart';
import '../../../providers/candidate_offer_provider.dart';

class CandidateDashboardScreen extends ConsumerWidget {
  const CandidateDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authStateProvider).valueOrNull;
    final fullProfileAsync = ref.watch(fullProfileProvider);
    final applicationsAsync = ref.watch(candidateApplicationsProvider);
    final offersAsync = ref.watch(candidateOffersProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mon espace'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Déconnexion',
            onPressed: () async =>
                ref.read(authStateProvider.notifier).logout(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(fullProfileProvider);
          ref.invalidate(candidateApplicationsProvider);
          ref.invalidate(candidateOffersProvider);
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Greeting
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
                        fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  const Text('Espace Candidat',
                      style: TextStyle(color: kGoldLight, fontSize: 13)),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Profile completion
            fullProfileAsync.when(
              loading: () => const LinearProgressIndicator(),
              error: (_, __) => const SizedBox.shrink(),
              data: (fp) => _CompletionCard(
                percent: fp.completion.total,
                onTap: () => context.go('/candidate/profile'),
              ),
            ),
            const SizedBox(height: 16),

            // Stats row
            Row(
              children: [
                Expanded(
                  child: applicationsAsync.when(
                    loading: () => _StatCard(
                        icon: Icons.assignment_outlined,
                        label: 'Candidatures',
                        value: '…'),
                    error: (_, __) => _StatCard(
                        icon: Icons.assignment_outlined,
                        label: 'Candidatures',
                        value: '-'),
                    data: (apps) => _StatCard(
                        icon: Icons.assignment_outlined,
                        label: 'Candidatures',
                        value: '${apps.length}',
                        onTap: () =>
                            context.go('/candidate/applications')),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: offersAsync.when(
                    loading: () => _StatCard(
                        icon: Icons.work_outline,
                        label: 'Offres actives',
                        value: '…'),
                    error: (_, __) => _StatCard(
                        icon: Icons.work_outline,
                        label: 'Offres actives',
                        value: '-'),
                    data: (offers) => _StatCard(
                        icon: Icons.work_outline,
                        label: 'Offres actives',
                        value: '${offers.length}',
                        onTap: () => context.go('/candidate/offers')),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Quick actions
            const Text('Actions rapides',
                style:
                    TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            _QuickAction(
              icon: Icons.search,
              label: 'Parcourir les offres',
              onTap: () => context.go('/candidate/offers'),
            ),
            const SizedBox(height: 8),
            _QuickAction(
              icon: Icons.description_outlined,
              label: 'Mes candidatures',
              onTap: () => context.go('/candidate/applications'),
            ),
            const SizedBox(height: 8),
            _QuickAction(
              icon: Icons.article_outlined,
              label: 'Mes lettres de motivation',
              onTap: () => context.go('/candidate/cover-letters'),
            ),
            const SizedBox(height: 8),
            _QuickAction(
              icon: Icons.upload_file_outlined,
              label: 'Mes CVs',
              onTap: () => context.go('/candidate/cvs'),
            ),
          ],
        ),
      ),
    );
  }
}

class _CompletionCard extends StatelessWidget {
  final int percent;
  final VoidCallback onTap;
  const _CompletionCard({required this.percent, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(color: kGold.withValues(alpha: 0.5)),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Complétude du profil',
                    style: TextStyle(fontWeight: FontWeight.bold)),
                Text('$percent%',
                    style: const TextStyle(
                        color: kPrimary,
                        fontWeight: FontWeight.bold,
                        fontSize: 18)),
              ],
            ),
            const SizedBox(height: 8),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: percent / 100,
                backgroundColor: Colors.grey.shade200,
                valueColor:
                    const AlwaysStoppedAnimation<Color>(kPrimary),
                minHeight: 8,
              ),
            ),
            const SizedBox(height: 6),
            const Text('Compléter votre profil améliore vos chances',
                style: TextStyle(fontSize: 11, color: Colors.grey)),
          ],
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final VoidCallback? onTap;
  const _StatCard(
      {required this.icon,
      required this.label,
      required this.value,
      this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          border: Border.all(color: kGold.withValues(alpha: 0.4)),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: kGold, size: 20),
            const SizedBox(height: 8),
            Text(value,
                style: const TextStyle(
                    color: kPrimary,
                    fontSize: 24,
                    fontWeight: FontWeight.bold)),
            Text(label,
                style:
                    const TextStyle(color: Colors.grey, fontSize: 11)),
          ],
        ),
      ),
    );
  }
}

class _QuickAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _QuickAction(
      {required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: kPrimary),
      title: Text(label),
      trailing: const Icon(Icons.chevron_right, color: Colors.grey),
      onTap: onTap,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      contentPadding:
          const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
    );
  }
}
