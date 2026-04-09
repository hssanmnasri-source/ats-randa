import 'package:flutter/material.dart';
import '../../core/theme.dart';

class ScoreRing extends StatelessWidget {
  final double score; // 0.0 – 1.0
  final double size;
  const ScoreRing({super.key, required this.score, this.size = 60});

  Color get _color {
    final pct = score * 100;
    if (pct >= 70) return Colors.green;
    if (pct >= 40) return Colors.orange;
    return Colors.red;
  }

  @override
  Widget build(BuildContext context) {
    final pct = (score * 100).round();
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          CircularProgressIndicator(
            value: score.clamp(0.0, 1.0),
            strokeWidth: 6,
            backgroundColor: Colors.grey.shade200,
            valueColor: AlwaysStoppedAnimation<Color>(_color),
          ),
          Text(
            '$pct%',
            style: TextStyle(
              fontSize: size * 0.22,
              fontWeight: FontWeight.bold,
              color: kPrimary,
            ),
          ),
        ],
      ),
    );
  }
}
