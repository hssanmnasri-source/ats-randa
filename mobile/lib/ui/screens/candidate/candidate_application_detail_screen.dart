import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme.dart';
import '../../../models/application.dart';
import '../../../providers/candidate_application_provider.dart';

class CandidateApplicationDetailScreen extends ConsumerWidget {
  final int applicationId;
  const CandidateApplicationDetailScreen(
      {super.key, required this.applicationId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detailAsync = ref.watch(applicationDetailProvider(applicationId));

    return Scaffold(
      appBar: AppBar(title: const Text('Ma candidature')),
      body: detailAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erreur : $e')),
        data: (detail) => SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Offer title
              Text(detail.offreTitre,
                  style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: kPrimary)),
              const SizedBox(height: 4),
              Text(
                'Score global : ${(detail.scoreFinal * 100).toStringAsFixed(0)}%',
                style: const TextStyle(color: Colors.grey),
              ),
              const SizedBox(height: 16),

              // Timeline
              const Text('Suivi de candidature',
                  style: TextStyle(
                      fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 12),
              ...detail.timeline.asMap().entries.map((entry) =>
                  _TimelineItem(
                    step: entry.value,
                    isLast: entry.key == detail.timeline.length - 1,
                  )),
              const SizedBox(height: 20),

              // Score breakdown
              const Text('Détail des scores',
                  style: TextStyle(
                      fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 12),
              _ScoreBar(
                  label: 'Similarité sémantique (40%)',
                  value: detail.scoreMatching),
              _ScoreBar(
                  label: 'Compétences (35%)',
                  value: detail.scoreSkills),
              _ScoreBar(
                  label: 'Expérience (15%)',
                  value: detail.scoreExperience),
              _ScoreBar(
                  label: 'Langue (10%)', value: detail.scoreLangue),
              const SizedBox(height: 20),

              // RH Feedback
              if (detail.feedbackVisible && detail.feedbackRh != null) ...[
                const Text('Retour de l\'équipe RH',
                    style: TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 8),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: kGold.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                        color: kGold.withValues(alpha: 0.4)),
                  ),
                  child: Text(detail.feedbackRh!,
                      style: const TextStyle(height: 1.5)),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _TimelineItem extends StatelessWidget {
  final TimelineStep step;
  final bool isLast;
  const _TimelineItem({required this.step, required this.isLast});

  @override
  Widget build(BuildContext context) {
    final color = _parseColor(step.color);
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Dot + line
          Column(
            children: [
              Container(
                width: 20,
                height: 20,
                decoration: BoxDecoration(
                  color: step.done ? color : Colors.grey.shade200,
                  shape: BoxShape.circle,
                  border: Border.all(
                      color: step.done ? color : Colors.grey.shade400,
                      width: 2),
                ),
                child: step.done
                    ? const Icon(Icons.check,
                        size: 12, color: Colors.white)
                    : step.active
                        ? Container(
                            margin: const EdgeInsets.all(3),
                            decoration: BoxDecoration(
                                color: color,
                                shape: BoxShape.circle))
                        : null,
              ),
              if (!isLast)
                Expanded(
                  child: Container(
                      width: 2,
                      color: step.done ? color : Colors.grey.shade300),
                ),
            ],
          ),
          const SizedBox(width: 12),
          // Content
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: isLast ? 0 : 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(step.label,
                      style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: step.done ? Colors.black : Colors.grey)),
                  const SizedBox(height: 2),
                  Text(step.description,
                      style: const TextStyle(
                          fontSize: 12, color: Colors.grey)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Color _parseColor(String hex) {
    try {
      return Color(
          int.parse(hex.replaceFirst('#', '0xFF')));
    } catch (_) {
      return Colors.grey;
    }
  }
}

class _ScoreBar extends StatelessWidget {
  final String label;
  final double value; // 0.0–1.0
  const _ScoreBar({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    final pct = (value * 100).clamp(0, 100).toStringAsFixed(0);
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label,
                  style: const TextStyle(fontSize: 13)),
              Text('$pct%',
                  style: const TextStyle(
                      fontSize: 13,
                      color: kPrimary,
                      fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 4),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: value.clamp(0.0, 1.0),
              backgroundColor: Colors.grey.shade200,
              valueColor:
                  const AlwaysStoppedAnimation<Color>(kPrimary),
              minHeight: 6,
            ),
          ),
        ],
      ),
    );
  }
}
