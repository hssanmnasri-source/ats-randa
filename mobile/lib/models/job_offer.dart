import 'package:freezed_annotation/freezed_annotation.dart';

part 'job_offer.freezed.dart';
part 'job_offer.g.dart';

@freezed
class JobOffer with _$JobOffer {
  const factory JobOffer({
    required int id,
    required String titre,
    @Default('') String description,
    @JsonKey(name: 'competences_requises') @Default([]) List<String> competencesRequises,
    @JsonKey(name: 'experience_requise') @Default(0.0) double experienceRequise,
    @JsonKey(name: 'langue_requise') @Default('') String langueRequise,
    @JsonKey(name: 'date_publication') @Default('') String datePublication,
    @JsonKey(name: 'plateforme_source') @Default('') String plateformeSource,
    @Default('ACTIVE') String statut,
    @JsonKey(name: 'id_rh') int? idRh,
    @JsonKey(name: 'seuil_alerte') int? seuilAlerte,
    @JsonKey(name: 'matching_auto') @Default(false) bool matchingAuto,
  }) = _JobOffer;

  factory JobOffer.fromJson(Map<String, dynamic> json) =>
      _$JobOfferFromJson(json);
}

@freezed
class JobOfferListResponse with _$JobOfferListResponse {
  const factory JobOfferListResponse({
    required int total,
    required List<JobOffer> offers,
  }) = _JobOfferListResponse;

  factory JobOfferListResponse.fromJson(Map<String, dynamic> json) =>
      _$JobOfferListResponseFromJson(json);
}
