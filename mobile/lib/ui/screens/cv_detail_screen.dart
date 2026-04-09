import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme.dart';
import '../../models/cv_summary.dart';
import '../../providers/cv_provider.dart';

class CvDetailScreen extends ConsumerWidget {
  final int cvId;
  const CvDetailScreen({super.key, required this.cvId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cvAsync = ref.watch(cvthequeProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Detail CV'),
        leading: BackButton(
          onPressed: () => context.canPop() ? context.pop() : context.go('/cvtheque'),
        ),
      ),
      body: cvAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erreur : $e')),
        data: (data) {
          final cv = data.results.where((c) => c.cvId == cvId).firstOrNull;
          if (cv == null) {
            return const Center(child: Text('CV introuvable'));
          }
          return _CvDetailBody(cv: cv);
        },
      ),
    );
  }
}

class _CvDetailBody extends StatelessWidget {
  final CvSummary cv;
  const _CvDetailBody({required this.cv});

  @override
  Widget build(BuildContext context) {
    final score = (cv.score * 100).round();
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          children: [
            CircleAvatar(
              radius: 32,
              backgroundColor: kPrimary,
              child: Text(
                (cv.nom.isNotEmpty ? cv.nom[0] : '?').toUpperCase(),
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${cv.prenom} ${cv.nom}'.trim(),
                    style: const TextStyle(
                        fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  if (cv.email.isNotEmpty)
                    Text(cv.email,
                        style: const TextStyle(color: Colors.grey)),
                  if (cv.telephone != null)
                    Text(cv.telephone!,
                        style: const TextStyle(color: Colors.grey)),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: kGold.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: kGold),
              ),
              child: Column(
                children: [
                  Text('$score%',
                      style: const TextStyle(
                          color: kPrimary,
                          fontWeight: FontWeight.bold,
                          fontSize: 16)),
                  const Text('score',
                      style: TextStyle(fontSize: 10, color: Colors.grey)),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),
        if (cv.source != null) ...[
          const Divider(),
          ListTile(
            leading: const Icon(Icons.source, color: kGold),
            title: const Text('Source'),
            subtitle: Text(cv.source!),
            dense: true,
          ),
        ],
        if (cv.extrait.isNotEmpty) ...[
          const Divider(),
          const Text('Extrait du CV',
              style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(cv.extrait,
              style: const TextStyle(color: Colors.black87, height: 1.5)),
        ],
      ],
    );
  }
}
