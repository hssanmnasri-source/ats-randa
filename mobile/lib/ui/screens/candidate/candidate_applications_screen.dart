import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme.dart';
import '../../../models/application.dart';
import '../../../providers/candidate_application_provider.dart';

class CandidateApplicationsScreen extends ConsumerWidget {
  const CandidateApplicationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final applicationsAsync = ref.watch(candidateApplicationsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Mes candidatures')),
      body: applicationsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erreur : $e')),
        data: (apps) => apps.isEmpty
            ? const Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.assignment_outlined,
                        size: 64, color: Colors.grey),
                    SizedBox(height: 12),
                    Text('Aucune candidature pour l\'instant',
                        style: TextStyle(color: Colors.grey)),
                  ],
                ),
              )
            : RefreshIndicator(
                onRefresh: () async =>
                    ref.invalidate(candidateApplicationsProvider),
                child: ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: apps.length,
                  itemBuilder: (_, i) => _ApplicationCard(
                    app: apps[i],
                    onTap: () =>
                        context.push('/candidate/applications/${apps[i].id}'),
                  ),
                ),
              ),
      ),
    );
  }
}

class _ApplicationCard extends StatelessWidget {
  final Application app;
  final VoidCallback onTap;
  const _ApplicationCard({required this.app, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        onTap: onTap,
        leading: CircleAvatar(
          backgroundColor: _decisionColor(app.decision).withValues(alpha: 0.15),
          child: Icon(
            _decisionIcon(app.decision),
            color: _decisionColor(app.decision),
            size: 20,
          ),
        ),
        title: Text(
          app.offre?.titre ?? 'Offre #${app.idOffre}',
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            _DecisionBadge(app.decision),
            const SizedBox(height: 4),
            Text(
              'Score : ${(app.scoreFinal * 100).toStringAsFixed(0)}%',
              style: const TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ],
        ),
        trailing: const Icon(Icons.chevron_right),
        isThreeLine: true,
      ),
    );
  }

  Color _decisionColor(String decision) {
    switch (decision) {
      case 'RETAINED':
        return Colors.green;
      case 'REFUSED':
        return Colors.red;
      default:
        return kGold;
    }
  }

  IconData _decisionIcon(String decision) {
    switch (decision) {
      case 'RETAINED':
        return Icons.check_circle_outline;
      case 'REFUSED':
        return Icons.cancel_outlined;
      default:
        return Icons.hourglass_empty;
    }
  }
}

class _DecisionBadge extends StatelessWidget {
  final String decision;
  const _DecisionBadge(this.decision);

  @override
  Widget build(BuildContext context) {
    final (label, bg, fg) = switch (decision) {
      'RETAINED' => ('Retenu ✓', Colors.green.shade50, Colors.green.shade700),
      'REFUSED' => ('Refusé ✗', Colors.red.shade50, Colors.red.shade700),
      _ => ('En attente', Colors.orange.shade50, Colors.orange.shade700),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
          color: bg, borderRadius: BorderRadius.circular(10)),
      child: Text(label,
          style: TextStyle(
              fontSize: 11, color: fg, fontWeight: FontWeight.bold)),
    );
  }
}
