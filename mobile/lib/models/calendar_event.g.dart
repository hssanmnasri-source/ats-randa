// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'calendar_event.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$CalendarEventImpl _$$CalendarEventImplFromJson(Map<String, dynamic> json) =>
    _$CalendarEventImpl(
      id: (json['id'] as num).toInt(),
      idOffre: (json['id_offre'] as num?)?.toInt() ?? 0,
      offreTitre: json['offre_titre'] as String?,
      dateEntretien: json['date_entretien'] as String,
      dureeMinutes: (json['duree_minutes'] as num?)?.toInt() ?? 30,
      lieu: json['lieu'] as String? ?? '',
      typeEntretien: json['type_entretien'] as String? ?? 'presentiel',
      lienVisio: json['lien_visio'] as String?,
      notesRh: json['notes_rh'] as String?,
      statut: json['statut'] as String? ?? 'PLANIFIE',
      candidatNom: json['candidat_nom'] as String?,
      candidatPrenom: json['candidat_prenom'] as String?,
      candidatEmail: json['candidat_email'] as String?,
      emailCandidatEnvoye: json['email_candidat_envoye'] as bool? ?? false,
    );

Map<String, dynamic> _$$CalendarEventImplToJson(_$CalendarEventImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'id_offre': instance.idOffre,
      'offre_titre': instance.offreTitre,
      'date_entretien': instance.dateEntretien,
      'duree_minutes': instance.dureeMinutes,
      'lieu': instance.lieu,
      'type_entretien': instance.typeEntretien,
      'lien_visio': instance.lienVisio,
      'notes_rh': instance.notesRh,
      'statut': instance.statut,
      'candidat_nom': instance.candidatNom,
      'candidat_prenom': instance.candidatPrenom,
      'candidat_email': instance.candidatEmail,
      'email_candidat_envoye': instance.emailCandidatEnvoye,
    };
