import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme.dart';
import '../../../providers/candidate_offer_provider.dart';
import '../../../repositories/candidate_application_repository.dart';

class CandidateOfferDetailScreen extends ConsumerWidget {
  final int offerId;
  const CandidateOfferDetailScreen({super.key, required this.offerId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final offerAsync = ref.watch(candidateOfferDetailProvider(offerId));

    return Scaffold(
      appBar: AppBar(title: const Text('Détail de l\'offre')),
      body: offerAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erreur : $e')),
        data: (offer) => SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(offer.titre,
                  style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: kPrimary)),
              const SizedBox(height: 8),

              // Meta chips
              Wrap(
                spacing: 8,
                runSpacing: 6,
                children: [
                  if (offer.ville != null)
                    _MetaChip(
                        icon: Icons.location_on_outlined,
                        label: offer.ville!),
                  _MetaChip(
                      icon: Icons.access_time_outlined,
                      label:
                          '${offer.experienceRequise.toInt()} ans d\'expérience'),
                  _MetaChip(
                      icon: Icons.language,
                      label: offer.langueRequise.toUpperCase()),
                  _MetaChip(
                      icon: Icons.people_outline,
                      label: '${offer.nbCandidatures} candidat(s)'),
                ],
              ),
              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 12),

              // Description
              const Text('Description',
                  style: TextStyle(
                      fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 8),
              Text(offer.description,
                  style: const TextStyle(height: 1.6, color: Colors.black87)),
              const SizedBox(height: 16),

              // Skills
              if (offer.competencesRequises.isNotEmpty) ...[
                const Text('Compétences requises',
                    style: TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  children: offer.competencesRequises
                      .map((s) => Chip(
                            label: Text(s,
                                style: const TextStyle(
                                    fontSize: 12)),
                            backgroundColor:
                                kGold.withValues(alpha: 0.15),
                          ))
                      .toList(),
                ),
                const SizedBox(height: 16),
              ],

              // Apply button
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  icon: const Icon(Icons.send_outlined),
                  label: const Text('Postuler à cette offre'),
                  onPressed: () => _apply(context, ref),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _apply(BuildContext context, WidgetRef ref) async {
    try {
      final result = await CandidateApplicationRepository().apply(offerId);
      if (!context.mounted) return;
      final msg = result['message'] as String? ??
          result['cv_required'] as String? ??
          'Candidature envoyée !';
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(msg)));
    } catch (e) {
      if (!context.mounted) return;
      final msg = e.toString().contains('400')
          ? 'Vous avez déjà postulé à cette offre ou aucun CV enregistré.'
          : 'Erreur : $e';
      ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(msg), backgroundColor: Colors.red.shade700));
    }
  }
}

class _MetaChip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _MetaChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: kPrimary.withValues(alpha: 0.07),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: kPrimary),
          const SizedBox(width: 4),
          Text(label,
              style: const TextStyle(fontSize: 12, color: kPrimary)),
        ],
      ),
    );
  }
}
