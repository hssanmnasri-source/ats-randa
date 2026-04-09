// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'matching_result.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$MatchingResultImpl _$$MatchingResultImplFromJson(Map<String, dynamic> json) =>
    _$MatchingResultImpl(
      id: (json['id'] as num).toInt(),
      idCv: (json['id_cv'] as num?)?.toInt() ?? 0,
      rang: (json['rang'] as num?)?.toInt() ?? 0,
      scoreFinal: (json['score_final'] as num?)?.toDouble() ?? 0.0,
      scoreMatching: (json['score_matching'] as num?)?.toDouble() ?? 0.0,
      scoreSkills: (json['score_skills'] as num?)?.toDouble() ?? 0.0,
      scoreExperience: (json['score_experience'] as num?)?.toDouble() ?? 0.0,
      scoreLangue: (json['score_langue'] as num?)?.toDouble() ?? 0.0,
      decision: json['decision'] as String? ?? 'PENDING',
      dateAnalyse: json['date_analyse'] as String?,
      candidatNom: json['candidat_nom'] as String? ?? '',
      candidatPrenom: json['candidat_prenom'] as String? ?? '',
      candidatEmail: json['candidat_email'] as String? ?? '',
      candidatTelephone: json['candidat_telephone'] as String?,
      feedbackRh: json['feedback_rh'] as String?,
      feedbackVisible: json['feedback_visible'] as bool? ?? false,
      dateDecision: json['date_decision'] as String?,
    );

Map<String, dynamic> _$$MatchingResultImplToJson(
        _$MatchingResultImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'id_cv': instance.idCv,
      'rang': instance.rang,
      'score_final': instance.scoreFinal,
      'score_matching': instance.scoreMatching,
      'score_skills': instance.scoreSkills,
      'score_experience': instance.scoreExperience,
      'score_langue': instance.scoreLangue,
      'decision': instance.decision,
      'date_analyse': instance.dateAnalyse,
      'candidat_nom': instance.candidatNom,
      'candidat_prenom': instance.candidatPrenom,
      'candidat_email': instance.candidatEmail,
      'candidat_telephone': instance.candidatTelephone,
      'feedback_rh': instance.feedbackRh,
      'feedback_visible': instance.feedbackVisible,
      'date_decision': instance.dateDecision,
    };

_$MatchingResponseImpl _$$MatchingResponseImplFromJson(
        Map<String, dynamic> json) =>
    _$MatchingResponseImpl(
      offerId: (json['offer_id'] as num).toInt(),
      titre: json['titre'] as String? ?? '',
      total: (json['total'] as num?)?.toInt() ?? 0,
      resultats: (json['resultats'] as List<dynamic>?)
              ?.map((e) => MatchingResult.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );

Map<String, dynamic> _$$MatchingResponseImplToJson(
        _$MatchingResponseImpl instance) =>
    <String, dynamic>{
      'offer_id': instance.offerId,
      'titre': instance.titre,
      'total': instance.total,
      'resultats': instance.resultats,
    };
