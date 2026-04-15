/// Mirrors CVOut from backend /api/candidate/cvs
class CandidateCV {
  final int id;
  final int idCandidate;
  final String dateDepot;
  final String statut;
  final String? source;
  final String? fichierPdf;
  final Map<String, dynamic>? cvEntities;
  final double scoreFinal;

  const CandidateCV({
    required this.id,
    required this.idCandidate,
    required this.dateDepot,
    required this.statut,
    this.source,
    this.fichierPdf,
    this.cvEntities,
    this.scoreFinal = 0.0,
  });

  factory CandidateCV.fromJson(Map<String, dynamic> json) {
    return CandidateCV(
      id: (json['id'] as num).toInt(),
      idCandidate: (json['id_candidate'] as num).toInt(),
      dateDepot: json['date_depot']?.toString() ?? '',
      statut: json['statut'] as String? ?? 'UPLOADED',
      source: json['source'] as String?,
      fichierPdf: json['fichier_pdf'] as String?,
      cvEntities: json['cv_entities'] as Map<String, dynamic>?,
      scoreFinal: (json['score_final'] as num?)?.toDouble() ?? 0.0,
    );
  }

  /// Name extracted from cv_entities or fallback
  String get displayName {
    final entities = cvEntities;
    if (entities != null) {
      final nom = entities['nom'] as String?;
      final prenom = entities['prenom'] as String?;
      if (nom != null || prenom != null) {
        return '${prenom ?? ''} ${nom ?? ''}'.trim();
      }
    }
    return 'CV #$id';
  }

  bool get isIndexed => statut == 'INDEXED';
  bool get isUploaded => statut == 'UPLOADED';
  bool get isError => statut == 'ERROR';
}
