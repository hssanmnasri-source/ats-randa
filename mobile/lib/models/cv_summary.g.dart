// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'cv_summary.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$CvSummaryImpl _$$CvSummaryImplFromJson(Map<String, dynamic> json) =>
    _$CvSummaryImpl(
      cvId: (json['cv_id'] as num).toInt(),
      nom: json['nom'] as String? ?? '',
      prenom: json['prenom'] as String? ?? '',
      email: json['email'] as String? ?? '',
      telephone: json['telephone'] as String?,
      source: json['source'] as String?,
      score: (json['score'] as num?)?.toDouble() ?? 0.0,
      extrait: json['extrait'] as String? ?? '',
    );

Map<String, dynamic> _$$CvSummaryImplToJson(_$CvSummaryImpl instance) =>
    <String, dynamic>{
      'cv_id': instance.cvId,
      'nom': instance.nom,
      'prenom': instance.prenom,
      'email': instance.email,
      'telephone': instance.telephone,
      'source': instance.source,
      'score': instance.score,
      'extrait': instance.extrait,
    };

_$CvSearchResponseImpl _$$CvSearchResponseImplFromJson(
        Map<String, dynamic> json) =>
    _$CvSearchResponseImpl(
      query: json['query'] as String? ?? '',
      total: (json['total'] as num?)?.toInt() ?? 0,
      results: (json['results'] as List<dynamic>?)
              ?.map((e) => CvSummary.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );

Map<String, dynamic> _$$CvSearchResponseImplToJson(
        _$CvSearchResponseImpl instance) =>
    <String, dynamic>{
      'query': instance.query,
      'total': instance.total,
      'results': instance.results,
    };
