import 'package:flutter/material.dart';

class StatusBadge extends StatelessWidget {
  final String status;
  const StatusBadge(this.status, {super.key});

  static Color _color(String s) {
    switch (s.toUpperCase()) {
      case 'POSTULÉ':
      case 'POSTULE':
        return Colors.blue;
      case 'ANALYSE_IA':
        return Colors.orange;
      case 'EN_EXAMEN':
        return Colors.purple;
      case 'DÉCISION':
      case 'DECISION':
        return Colors.teal;
      case 'RETENU':
      case 'RETAINED':
        return Colors.green;
      case 'REFUSÉ':
      case 'REFUSED':
        return Colors.red;
      case 'PENDING':
        return Colors.grey;
      case 'INDEXED':
      case 'INDEXÉ':
        return Colors.grey;
      case 'ACTIVE':
      case 'ACTIF':
        return Colors.green;
      case 'ARCHIVED':
      case 'ARCHIVÉ':
      case 'FERMÉ':
        return Colors.grey;
      case 'PLANIFIE':
      case 'PLANIFIÉ':
        return Colors.blue;
      case 'ANNULE':
      case 'ANNULÉ':
        return Colors.red;
      default:
        return Colors.blueGrey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = _color(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.5)),
      ),
      child: Text(
        status,
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
