import 'package:freezed_annotation/freezed_annotation.dart';

part 'matching_result.freezed.dart';
part 'matching_result.g.dart';

@freezed
class MatchingResult with _$MatchingResult {
  const factory MatchingResult({
    required int id,
    @JsonKey(name: 'id_cv') @Default(0) int idCv,
    @Default(0) int rang,
    @JsonKey(name: 'score_final') @Default(0.0) double scoreFinal,
    @JsonKey(name: 'score_matching') @Default(0.0) double scoreMatching,
    @JsonKey(name: 'score_skills') @Default(0.0) double scoreSkills,
    @JsonKey(name: 'score_experience') @Default(0.0) double scoreExperience,
    @JsonKey(name: 'score_langue') @Default(0.0) double scoreLangue,
    @Default('PENDING') String decision,
    @JsonKey(name: 'date_analyse') String? dateAnalyse,
    @JsonKey(name: 'candidat_nom') @Default('') String candidatNom,
    @JsonKey(name: 'candidat_prenom') @Default('') String candidatPrenom,
    @JsonKey(name: 'candidat_email') @Default('') String candidatEmail,
    @JsonKey(name: 'candidat_telephone') String? candidatTelephone,
    @JsonKey(name: 'feedback_rh') String? feedbackRh,
    @JsonKey(name: 'feedback_visible') @Default(false) bool feedbackVisible,
    @JsonKey(name: 'date_decision') String? dateDecision,
  }) = _MatchingResult;

  factory MatchingResult.fromJson(Map<String, dynamic> json) =>
      _$MatchingResultFromJson(json);
}

@freezed
class MatchingResponse with _$MatchingResponse {
  const factory MatchingResponse({
    @JsonKey(name: 'offer_id') required int offerId,
    @Default('') String titre,
    @Default(0) int total,
    @Default([]) List<MatchingResult> resultats,
  }) = _MatchingResponse;

  factory MatchingResponse.fromJson(Map<String, dynamic> json) =>
      _$MatchingResponseFromJson(json);
}
