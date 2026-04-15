import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme.dart';
import '../../../models/candidate_cv.dart';
import '../../../providers/candidate_cv_provider.dart';

class CandidateCvsScreen extends ConsumerWidget {
  const CandidateCvsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cvsAsync = ref.watch(candidateCvsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Mes CVs')),
      body: cvsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erreur : $e')),
        data: (cvs) => cvs.isEmpty
            ? const Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.description_outlined,
                        size: 64, color: Colors.grey),
                    SizedBox(height: 12),
                    Text('Aucun CV enregistré',
                        style: TextStyle(color: Colors.grey)),
                    SizedBox(height: 6),
                    Text(
                        'Déposez votre CV depuis l\'espace web',
                        style: TextStyle(color: Colors.grey, fontSize: 12)),
                  ],
                ),
              )
            : RefreshIndicator(
                onRefresh: () async =>
                    ref.invalidate(candidateCvsProvider),
                child: ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: cvs.length,
                  itemBuilder: (_, i) => _CvCard(cv: cvs[i]),
                ),
              ),
      ),
    );
  }
}

class _CvCard extends StatelessWidget {
  final CandidateCV cv;
  const _CvCard({required this.cv});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: _statusColor(cv.statut).withValues(alpha: 0.15),
          child: Icon(_statusIcon(cv.statut),
              color: _statusColor(cv.statut), size: 20),
        ),
        title: Text(cv.displayName,
            style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            _StatusChip(cv.statut),
            if (cv.source != null)
              Padding(
                padding: const EdgeInsets.only(top: 2),
                child: Text('Source : ${cv.source}',
                    style: const TextStyle(
                        fontSize: 11, color: Colors.grey)),
              ),
          ],
        ),
        trailing: cv.isIndexed
            ? Text('${(cv.scoreFinal * 100).toStringAsFixed(0)}%',
                style: const TextStyle(
                    color: kPrimary,
                    fontWeight: FontWeight.bold))
            : null,
        isThreeLine: true,
      ),
    );
  }

  Color _statusColor(String statut) {
    switch (statut) {
      case 'INDEXED':
        return Colors.green;
      case 'ERROR':
        return Colors.red;
      default:
        return kGold;
    }
  }

  IconData _statusIcon(String statut) {
    switch (statut) {
      case 'INDEXED':
        return Icons.check_circle_outline;
      case 'ERROR':
        return Icons.error_outline;
      default:
        return Icons.hourglass_empty;
    }
  }
}

class _StatusChip extends StatelessWidget {
  final String statut;
  const _StatusChip(this.statut);

  @override
  Widget build(BuildContext context) {
    final (label, bg, fg) = switch (statut) {
      'INDEXED' => ('Indexé', Colors.green.shade50, Colors.green.shade700),
      'ERROR' => ('Erreur', Colors.red.shade50, Colors.red.shade700),
      'PARSING' => ('Analyse…', Colors.blue.shade50, Colors.blue.shade700),
      _ => ('Chargé', Colors.orange.shade50, Colors.orange.shade700),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
          color: bg, borderRadius: BorderRadius.circular(10)),
      child: Text(label,
          style: TextStyle(
              fontSize: 11,
              color: fg,
              fontWeight: FontWeight.bold)),
    );
  }
}
