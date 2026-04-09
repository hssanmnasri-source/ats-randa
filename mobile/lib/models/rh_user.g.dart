// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'rh_user.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$RhUserImpl _$$RhUserImplFromJson(Map<String, dynamic> json) => _$RhUserImpl(
      id: (json['id'] as num).toInt(),
      email: json['email'] as String,
      nom: json['nom'] as String? ?? '',
      prenom: json['prenom'] as String? ?? '',
      role: json['role'] as String? ?? 'rh',
    );

Map<String, dynamic> _$$RhUserImplToJson(_$RhUserImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'email': instance.email,
      'nom': instance.nom,
      'prenom': instance.prenom,
      'role': instance.role,
    };
