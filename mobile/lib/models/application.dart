/// Mirrors ApplicationOut — GET /api/candidate/applications
class Application {
  final int id;
  final int idOffre;
  final int idCv;
  final double scoreFinal;
  final String decision;
  final String dateAnalyse;
  final OfferResume? offre;

  const Application({
    required this.id,
    required this.idOffre,
    required this.idCv,
    required this.scoreFinal,
    required this.decision,
    required this.dateAnalyse,
    this.offre,
  });

  factory Application.fromJson(Map<String, dynamic> json) {
    return Application(
      id: (json['id'] as num).toInt(),
      idOffre: (json['id_offre'] as num).toInt(),
      idCv: (json['id_cv'] as num).toInt(),
      scoreFinal: (json['score_final'] as num?)?.toDouble() ?? 0.0,
      decision: json['decision'] as String? ?? 'PENDING',
      dateAnalyse: json['date_analyse']?.toString() ?? '',
      offre: json['offre'] != null
          ? OfferResume.fromJson(json['offre'] as Map<String, dynamic>)
          : null,
    );
  }

  bool get isPending => decision == 'PENDING';
  bool get isRetained => decision == 'RETAINED';
  bool get isRefused => decision == 'REFUSED';
}

class OfferResume {
  final int id;
  final String titre;
  final String? description;
  final String? statut;

  const OfferResume({
    required this.id,
    required this.titre,
    this.description,
    this.statut,
  });

  factory OfferResume.fromJson(Map<String, dynamic> json) {
    return OfferResume(
      id: (json['id'] as num).toInt(),
      titre: json['titre'] as String? ?? '',
      description: json['description'] as String?,
      statut: json['statut'] as String?,
    );
  }
}

/// Mirrors GET /api/candidate/applications/{id}/detail
class ApplicationDetail {
  final int id;
  final int offreId;
  final String offreTitre;
  final String dateCandidature;
  final String decision;
  final double scoreFinal;
  final double scoreMatching;
  final double scoreSkills;
  final double scoreExperience;
  final double scoreLangue;
  final String? feedbackRh;
  final bool feedbackVisible;
  final String? dateDecision;
  final List<TimelineStep> timeline;

  const ApplicationDetail({
    required this.id,
    required this.offreId,
    required this.offreTitre,
    required this.dateCandidature,
    required this.decision,
    required this.scoreFinal,
    required this.scoreMatching,
    required this.scoreSkills,
    required this.scoreExperience,
    required this.scoreLangue,
    this.feedbackRh,
    this.feedbackVisible = false,
    this.dateDecision,
    this.timeline = const [],
  });

  factory ApplicationDetail.fromJson(Map<String, dynamic> json) {
    return ApplicationDetail(
      id: (json['id'] as num).toInt(),
      offreId: (json['offre_id'] as num).toInt(),
      offreTitre: json['offre_titre'] as String? ?? '',
      dateCandidature: json['date_candidature']?.toString() ?? '',
      decision: json['decision'] as String? ?? 'PENDING',
      scoreFinal: (json['score_final'] as num?)?.toDouble() ?? 0.0,
      scoreMatching: (json['score_matching'] as num?)?.toDouble() ?? 0.0,
      scoreSkills: (json['score_skills'] as num?)?.toDouble() ?? 0.0,
      scoreExperience: (json['score_experience'] as num?)?.toDouble() ?? 0.0,
      scoreLangue: (json['score_langue'] as num?)?.toDouble() ?? 0.0,
      feedbackRh: json['feedback_rh'] as String?,
      feedbackVisible: json['feedback_visible'] as bool? ?? false,
      dateDecision: json['date_decision']?.toString(),
      timeline: (json['timeline'] as List? ?? [])
          .map((e) => TimelineStep.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class TimelineStep {
  final String statut;
  final String label;
  final String description;
  final String? date;
  final bool done;
  final bool active;
  final String color;

  const TimelineStep({
    required this.statut,
    required this.label,
    required this.description,
    this.date,
    required this.done,
    required this.active,
    required this.color,
  });

  factory TimelineStep.fromJson(Map<String, dynamic> json) {
    return TimelineStep(
      statut: json['statut'] as String? ?? '',
      label: json['label'] as String? ?? '',
      description: json['description'] as String? ?? '',
      date: json['date'] as String?,
      done: json['done'] as bool? ?? false,
      active: json['active'] as bool? ?? false,
      color: json['color'] as String? ?? '#D9D9D9',
    );
  }
}
