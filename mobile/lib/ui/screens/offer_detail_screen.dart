import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme.dart';
import '../../providers/offers_provider.dart';
import '../../providers/matching_provider.dart';
import '../widgets/status_badge.dart';

class OfferDetailScreen extends ConsumerWidget {
  final int offerId;
  const OfferDetailScreen({super.key, required this.offerId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final offerAsync = ref.watch(offerDetailProvider(offerId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Détail offre'),
        leading: BackButton(onPressed: () => context.canPop() ? context.pop() : context.go('/offers')),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit),
            onPressed: () => context.push('/offers/$offerId/edit'),
          ),
        ],
      ),
      body: offerAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erreur : $e')),
        data: (offer) => RefreshIndicator(
          onRefresh: () async => ref.invalidate(offerDetailProvider(offerId)),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(offer.titre,
                        style: const TextStyle(
                            fontSize: 20, fontWeight: FontWeight.bold)),
                  ),
                  StatusBadge(offer.statut),
                ],
              ),
              const SizedBox(height: 16),
              const Text('Description',
                  style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              Text(offer.description),
              const SizedBox(height: 16),
              if (offer.competencesRequises.isNotEmpty) ...[
                const Text('Competences requises',
                    style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: offer.competencesRequises
                      .map((c) => Chip(
                            label: Text(c),
                            backgroundColor: kGoldLight,
                          ))
                      .toList(),
                ),
                const SizedBox(height: 16),
              ],
              _infoRow(Icons.work_outline,
                  '${offer.experienceRequise.toInt()} ans experience requis'),
              _infoRow(Icons.language, 'Langue : ${offer.langueRequise}'),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                icon: const Icon(Icons.play_arrow),
                label: const Text('Lancer le Matching'),
                style: ElevatedButton.styleFrom(backgroundColor: kDarkBrown),
                onPressed: () => _launchMatching(context, ref),
              ),
              const SizedBox(height: 10),
              OutlinedButton.icon(
                icon: const Icon(Icons.bar_chart, color: kPrimary),
                label: const Text('Voir les resultats',
                    style: TextStyle(color: kPrimary)),
                onPressed: () => context.push('/offers/$offerId/matching'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _infoRow(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, size: 16, color: Colors.grey),
          const SizedBox(width: 8),
          Text(text, style: const TextStyle(color: Colors.grey)),
        ],
      ),
    );
  }

  Future<void> _launchMatching(BuildContext context, WidgetRef ref) async {
    final scaffold = ScaffoldMessenger.of(context);
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const AlertDialog(
        content: Row(
          children: [
            CircularProgressIndicator(),
            SizedBox(width: 16),
            Text('Lancement du matching...'),
          ],
        ),
      ),
    );

    try {
      await ref.read(matchingRepositoryProvider).triggerMatching(offerId);
      if (!context.mounted) return;
      Navigator.of(context).pop();
      ref.invalidate(offerDetailProvider(offerId));
      ref.invalidate(matchingResultsProvider(offerId));
      context.push('/offers/$offerId/matching');
    } catch (e) {
      if (!context.mounted) return;
      Navigator.of(context).pop();
      scaffold.showSnackBar(
        SnackBar(
          content: Text('Erreur matching : $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}
