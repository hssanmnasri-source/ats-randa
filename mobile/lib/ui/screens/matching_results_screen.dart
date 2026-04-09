import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme.dart';
import '../../models/matching_result.dart';
import '../../providers/matching_provider.dart';
import '../../providers/dashboard_provider.dart';
import '../widgets/score_ring.dart';
import '../widgets/status_badge.dart';

class MatchingResultsScreen extends ConsumerWidget {
  final int offerId;
  const MatchingResultsScreen({super.key, required this.offerId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final matchAsync = ref.watch(matchingResultsProvider(offerId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Résultats Matching'),
        leading: BackButton(onPressed: () => context.canPop() ? context.pop() : context.go('/offers')),
      ),
      body: matchAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erreur : $e')),
        data: (data) => RefreshIndicator(
          onRefresh: () async =>
              ref.invalidate(matchingResultsProvider(offerId)),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(data.titre,
                        style: const TextStyle(
                            fontSize: 16, fontWeight: FontWeight.bold)),
                    Text('${data.total} candidats analysés',
                        style: const TextStyle(
                            color: Colors.grey, fontSize: 13)),
                  ],
                ),
              ),
              Expanded(
                child: data.resultats.isEmpty
                    ? const Center(child: Text('Aucun résultat'))
                    : ListView.builder(
                        itemCount: data.resultats.length,
                        itemBuilder: (_, i) => _MatchCard(
                          result: data.resultats[i],
                          offerId: offerId,
                          onDecisionMade: () {
                            ref.invalidate(matchingResultsProvider(offerId));
                            ref.invalidate(dashboardStatsProvider);
                          },
                        ),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MatchCard extends ConsumerWidget {
  final MatchingResult result;
  final int offerId;
  final VoidCallback onDecisionMade;
  const _MatchCard({
    required this.result,
    required this.offerId,
    required this.onDecisionMade,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${result.candidatPrenom} ${result.candidatNom}'.trim(),
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      Text(result.candidatEmail,
                          style: const TextStyle(
                              color: Colors.grey, fontSize: 12)),
                    ],
                  ),
                ),
                ScoreRing(score: result.scoreFinal),
              ],
            ),
            const SizedBox(height: 12),
            _ScoreBar('Sémantique', result.scoreMatching, kPrimary),
            _ScoreBar('Compétences', result.scoreSkills, kGold),
            _ScoreBar('Expérience', result.scoreExperience, Colors.teal),
            _ScoreBar('Langue', result.scoreLangue, Colors.purple),
            const SizedBox(height: 10),
            Row(
              children: [
                StatusBadge(result.decision),
                const Spacer(),
                if (result.decision == 'PENDING') ...[
                  TextButton(
                    onPressed: () =>
                        _showDecisionSheet(context, ref, 'RETAINED'),
                    style: TextButton.styleFrom(foregroundColor: Colors.green),
                    child: const Text('Retenir'),
                  ),
                  TextButton(
                    onPressed: () =>
                        _showDecisionSheet(context, ref, 'REFUSED'),
                    style: TextButton.styleFrom(foregroundColor: Colors.red),
                    child: const Text('Refuser'),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showDecisionSheet(
      BuildContext context, WidgetRef ref, String decision) {
    final feedbackCtrl = TextEditingController();
    bool feedbackVisible = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(
            16, 16, 16, MediaQuery.of(ctx).viewInsets.bottom + 16),
        child: StatefulBuilder(builder: (_, setState) {
          return Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                decision == 'RETAINED'
                    ? 'Retenir ce candidat'
                    : 'Refuser ce candidat',
                style: const TextStyle(
                    fontWeight: FontWeight.bold, fontSize: 16),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: feedbackCtrl,
                decoration: const InputDecoration(
                  labelText: 'Feedback RH (optionnel)',
                  border: OutlineInputBorder(),
                ),
                maxLines: 3,
              ),
              const SizedBox(height: 10),
              SwitchListTile(
                title: const Text('Feedback visible au candidat'),
                value: feedbackVisible,
                activeThumbColor: kPrimary,
                onChanged: (v) => setState(() => feedbackVisible = v),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor:
                        decision == 'RETAINED' ? Colors.green : Colors.red,
                  ),
                  onPressed: () async {
                    Navigator.pop(ctx);
                    await ref
                        .read(matchingRepositoryProvider)
                        .makeDecision(
                          offerId,
                          result.id,
                          decision,
                          feedbackRh: feedbackCtrl.text.isEmpty
                              ? null
                              : feedbackCtrl.text,
                          feedbackVisible: feedbackVisible,
                        );
                    onDecisionMade();
                  },
                  child: const Text('Confirmer'),
                ),
              ),
            ],
          );
        }),
      ),
    );
  }
}

class _ScoreBar extends StatelessWidget {
  final String label;
  final double value;
  final Color color;
  const _ScoreBar(this.label, this.value, this.color);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          SizedBox(
              width: 90,
              child: Text(label,
                  style: const TextStyle(fontSize: 11, color: Colors.grey))),
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: value.clamp(0.0, 1.0),
                backgroundColor: Colors.grey.shade200,
                valueColor: AlwaysStoppedAnimation<Color>(color),
                minHeight: 6,
              ),
            ),
          ),
          const SizedBox(width: 6),
          SizedBox(
            width: 36,
            child: Text(
              '${(value * 100).round()}%',
              style: const TextStyle(fontSize: 11),
              textAlign: TextAlign.right,
            ),
          ),
        ],
      ),
    );
  }
}
