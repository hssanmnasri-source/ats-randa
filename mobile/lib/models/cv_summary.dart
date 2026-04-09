import 'package:freezed_annotation/freezed_annotation.dart';

part 'cv_summary.freezed.dart';
part 'cv_summary.g.dart';

@freezed
class CvSummary with _$CvSummary {
  const factory CvSummary({
    @JsonKey(name: 'cv_id') required int cvId,
    @Default('') String nom,
    @Default('') String prenom,
    @Default('') String email,
    String? telephone,
    String? source,
    @Default(0.0) double score,
    @Default('') String extrait,
  }) = _CvSummary;

  factory CvSummary.fromJson(Map<String, dynamic> json) =>
      _$CvSummaryFromJson(json);
}

@freezed
class CvSearchResponse with _$CvSearchResponse {
  const factory CvSearchResponse({
    @Default('') String query,
    @Default(0) int total,
    @Default([]) List<CvSummary> results,
  }) = _CvSearchResponse;

  factory CvSearchResponse.fromJson(Map<String, dynamic> json) =>
      _$CvSearchResponseFromJson(json);
}
