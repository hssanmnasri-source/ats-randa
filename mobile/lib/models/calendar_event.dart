import 'package:freezed_annotation/freezed_annotation.dart';

part 'calendar_event.freezed.dart';
part 'calendar_event.g.dart';

@freezed
class CalendarEvent with _$CalendarEvent {
  const factory CalendarEvent({
    required int id,
    @JsonKey(name: 'id_offre') @Default(0) int idOffre,
    @JsonKey(name: 'offre_titre') String? offreTitre,
    @JsonKey(name: 'date_entretien') required String dateEntretien,
    @JsonKey(name: 'duree_minutes') @Default(30) int dureeMinutes,
    @Default('') String lieu,
    @JsonKey(name: 'type_entretien') @Default('presentiel') String typeEntretien,
    @JsonKey(name: 'lien_visio') String? lienVisio,
    @JsonKey(name: 'notes_rh') String? notesRh,
    @Default('PLANIFIE') String statut,
    @JsonKey(name: 'candidat_nom') String? candidatNom,
    @JsonKey(name: 'candidat_prenom') String? candidatPrenom,
    @JsonKey(name: 'candidat_email') String? candidatEmail,
    @JsonKey(name: 'email_candidat_envoye') @Default(false) bool emailCandidatEnvoye,
  }) = _CalendarEvent;

  factory CalendarEvent.fromJson(Map<String, dynamic> json) =>
      _$CalendarEventFromJson(json);
}
