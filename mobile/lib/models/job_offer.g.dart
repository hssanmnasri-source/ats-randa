// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'job_offer.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$JobOfferImpl _$$JobOfferImplFromJson(Map<String, dynamic> json) =>
    _$JobOfferImpl(
      id: (json['id'] as num).toInt(),
      titre: json['titre'] as String,
      description: json['description'] as String? ?? '',
      competencesRequises: (json['competences_requises'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      experienceRequise:
          (json['experience_requise'] as num?)?.toDouble() ?? 0.0,
      langueRequise: json['langue_requise'] as String? ?? '',
      datePublication: json['date_publication'] as String? ?? '',
      plateformeSource: json['plateforme_source'] as String? ?? '',
      statut: json['statut'] as String? ?? 'ACTIVE',
      idRh: (json['id_rh'] as num?)?.toInt(),
      seuilAlerte: (json['seuil_alerte'] as num?)?.toInt(),
      matchingAuto: json['matching_auto'] as bool? ?? false,
    );

Map<String, dynamic> _$$JobOfferImplToJson(_$JobOfferImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'titre': instance.titre,
      'description': instance.description,
      'competences_requises': instance.competencesRequises,
      'experience_requise': instance.experienceRequise,
      'langue_requise': instance.langueRequise,
      'date_publication': instance.datePublication,
      'plateforme_source': instance.plateformeSource,
      'statut': instance.statut,
      'id_rh': instance.idRh,
      'seuil_alerte': instance.seuilAlerte,
      'matching_auto': instance.matchingAuto,
    };

_$JobOfferListResponseImpl _$$JobOfferListResponseImplFromJson(
        Map<String, dynamic> json) =>
    _$JobOfferListResponseImpl(
      total: (json['total'] as num).toInt(),
      offers: (json['offers'] as List<dynamic>)
          .map((e) => JobOffer.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$$JobOfferListResponseImplToJson(
        _$JobOfferListResponseImpl instance) =>
    <String, dynamic>{
      'total': instance.total,
      'offers': instance.offers,
    };
