import 'package:flutter/material.dart';
import '../../core/theme.dart';
import '../../models/job_offer.dart';
import 'status_badge.dart';

class OfferCard extends StatelessWidget {
  final JobOffer offer;
  final VoidCallback? onTap;
  const OfferCard({super.key, required this.offer, this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      offer.titre,
                      style: const TextStyle(
                          fontWeight: FontWeight.bold, fontSize: 15),
                    ),
                  ),
                  StatusBadge(offer.statut),
                ],
              ),
              if (offer.competencesRequises.isNotEmpty) ...[
                const SizedBox(height: 8),
                Wrap(
                  spacing: 4,
                  runSpacing: 4,
                  children: offer.competencesRequises.take(2).map((c) {
                    return Chip(
                      label: Text(c, style: const TextStyle(fontSize: 11)),
                      backgroundColor: kGoldLight,
                      padding: EdgeInsets.zero,
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    );
                  }).toList(),
                ),
              ],
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.work_outline, size: 14, color: Colors.grey),
                  const SizedBox(width: 4),
                  Text(
                    '${offer.experienceRequise.toInt()} ans exp.',
                    style: const TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                  const Spacer(),
                  const Icon(Icons.arrow_forward_ios, size: 14, color: Colors.grey),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
