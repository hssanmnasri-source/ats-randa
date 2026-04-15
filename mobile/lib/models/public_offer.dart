/// Mirrors PublicOfferOut from backend GET /api/visitor/offers
class PublicOffer {
  final int id;
  final String titre;
  final String description;
  final List<String> competencesRequises;
  final double experienceRequise;
  final String langueRequise;
  final String datePublication;
  final String plateformeSource;
  final int nbCandidatures;
  final bool isNew;
  final String? ville;

  const PublicOffer({
    required this.id,
    required this.titre,
    required this.description,
    required this.competencesRequises,
    required this.experienceRequise,
    required this.langueRequise,
    required this.datePublication,
    required this.plateformeSource,
    this.nbCandidatures = 0,
    this.isNew = false,
    this.ville,
  });

  factory PublicOffer.fromJson(Map<String, dynamic> json) {
    return PublicOffer(
      id: (json['id'] as num).toInt(),
      titre: json['titre'] as String? ?? '',
      description: json['description'] as String? ?? '',
      competencesRequises: (json['competences_requises'] as List? ?? [])
          .map((e) => e.toString())
          .toList(),
      experienceRequise:
          (json['experience_requise'] as num?)?.toDouble() ?? 0.0,
      langueRequise: json['langue_requise'] as String? ?? 'fr',
      datePublication: json['date_publication']?.toString() ?? '',
      plateformeSource: json['plateforme_source'] as String? ?? '',
      nbCandidatures: (json['nb_candidatures'] as num?)?.toInt() ?? 0,
      isNew: json['is_new'] as bool? ?? false,
      ville: json['ville'] as String?,
    );
  }
}
