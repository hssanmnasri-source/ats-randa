import 'package:flutter/material.dart';
import '../../core/theme.dart';
import '../../models/cv_summary.dart';

class CvCard extends StatelessWidget {
  final CvSummary cv;
  final VoidCallback? onTap;
  const CvCard({super.key, required this.cv, this.onTap});

  @override
  Widget build(BuildContext context) {
    final score = (cv.score * 100).round();
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              CircleAvatar(
                backgroundColor: kPrimary,
                radius: 22,
                child: Text(
                  (cv.nom.isNotEmpty ? cv.nom[0] : '?').toUpperCase(),
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${cv.prenom} ${cv.nom}'.trim(),
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    if (cv.email.isNotEmpty)
                      Text(cv.email,
                          style: const TextStyle(fontSize: 12, color: Colors.grey)),
                    if (cv.extrait.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        cv.extrait,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 11, color: Colors.grey),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: kGold.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: kGold),
                ),
                child: Text(
                  '$score%',
                  style: const TextStyle(
                    color: kPrimary,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
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
