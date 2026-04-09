// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'calendar_event.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

CalendarEvent _$CalendarEventFromJson(Map<String, dynamic> json) {
  return _CalendarEvent.fromJson(json);
}

/// @nodoc
mixin _$CalendarEvent {
  int get id => throw _privateConstructorUsedError;
  @JsonKey(name: 'id_offre')
  int get idOffre => throw _privateConstructorUsedError;
  @JsonKey(name: 'offre_titre')
  String? get offreTitre => throw _privateConstructorUsedError;
  @JsonKey(name: 'date_entretien')
  String get dateEntretien => throw _privateConstructorUsedError;
  @JsonKey(name: 'duree_minutes')
  int get dureeMinutes => throw _privateConstructorUsedError;
  String get lieu => throw _privateConstructorUsedError;
  @JsonKey(name: 'type_entretien')
  String get typeEntretien => throw _privateConstructorUsedError;
  @JsonKey(name: 'lien_visio')
  String? get lienVisio => throw _privateConstructorUsedError;
  @JsonKey(name: 'notes_rh')
  String? get notesRh => throw _privateConstructorUsedError;
  String get statut => throw _privateConstructorUsedError;
  @JsonKey(name: 'candidat_nom')
  String? get candidatNom => throw _privateConstructorUsedError;
  @JsonKey(name: 'candidat_prenom')
  String? get candidatPrenom => throw _privateConstructorUsedError;
  @JsonKey(name: 'candidat_email')
  String? get candidatEmail => throw _privateConstructorUsedError;
  @JsonKey(name: 'email_candidat_envoye')
  bool get emailCandidatEnvoye => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $CalendarEventCopyWith<CalendarEvent> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CalendarEventCopyWith<$Res> {
  factory $CalendarEventCopyWith(
          CalendarEvent value, $Res Function(CalendarEvent) then) =
      _$CalendarEventCopyWithImpl<$Res, CalendarEvent>;
  @useResult
  $Res call(
      {int id,
      @JsonKey(name: 'id_offre') int idOffre,
      @JsonKey(name: 'offre_titre') String? offreTitre,
      @JsonKey(name: 'date_entretien') String dateEntretien,
      @JsonKey(name: 'duree_minutes') int dureeMinutes,
      String lieu,
      @JsonKey(name: 'type_entretien') String typeEntretien,
      @JsonKey(name: 'lien_visio') String? lienVisio,
      @JsonKey(name: 'notes_rh') String? notesRh,
      String statut,
      @JsonKey(name: 'candidat_nom') String? candidatNom,
      @JsonKey(name: 'candidat_prenom') String? candidatPrenom,
      @JsonKey(name: 'candidat_email') String? candidatEmail,
      @JsonKey(name: 'email_candidat_envoye') bool emailCandidatEnvoye});
}

/// @nodoc
class _$CalendarEventCopyWithImpl<$Res, $Val extends CalendarEvent>
    implements $CalendarEventCopyWith<$Res> {
  _$CalendarEventCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? idOffre = null,
    Object? offreTitre = freezed,
    Object? dateEntretien = null,
    Object? dureeMinutes = null,
    Object? lieu = null,
    Object? typeEntretien = null,
    Object? lienVisio = freezed,
    Object? notesRh = freezed,
    Object? statut = null,
    Object? candidatNom = freezed,
    Object? candidatPrenom = freezed,
    Object? candidatEmail = freezed,
    Object? emailCandidatEnvoye = null,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      idOffre: null == idOffre
          ? _value.idOffre
          : idOffre // ignore: cast_nullable_to_non_nullable
              as int,
      offreTitre: freezed == offreTitre
          ? _value.offreTitre
          : offreTitre // ignore: cast_nullable_to_non_nullable
              as String?,
      dateEntretien: null == dateEntretien
          ? _value.dateEntretien
          : dateEntretien // ignore: cast_nullable_to_non_nullable
              as String,
      dureeMinutes: null == dureeMinutes
          ? _value.dureeMinutes
          : dureeMinutes // ignore: cast_nullable_to_non_nullable
              as int,
      lieu: null == lieu
          ? _value.lieu
          : lieu // ignore: cast_nullable_to_non_nullable
              as String,
      typeEntretien: null == typeEntretien
          ? _value.typeEntretien
          : typeEntretien // ignore: cast_nullable_to_non_nullable
              as String,
      lienVisio: freezed == lienVisio
          ? _value.lienVisio
          : lienVisio // ignore: cast_nullable_to_non_nullable
              as String?,
      notesRh: freezed == notesRh
          ? _value.notesRh
          : notesRh // ignore: cast_nullable_to_non_nullable
              as String?,
      statut: null == statut
          ? _value.statut
          : statut // ignore: cast_nullable_to_non_nullable
              as String,
      candidatNom: freezed == candidatNom
          ? _value.candidatNom
          : candidatNom // ignore: cast_nullable_to_non_nullable
              as String?,
      candidatPrenom: freezed == candidatPrenom
          ? _value.candidatPrenom
          : candidatPrenom // ignore: cast_nullable_to_non_nullable
              as String?,
      candidatEmail: freezed == candidatEmail
          ? _value.candidatEmail
          : candidatEmail // ignore: cast_nullable_to_non_nullable
              as String?,
      emailCandidatEnvoye: null == emailCandidatEnvoye
          ? _value.emailCandidatEnvoye
          : emailCandidatEnvoye // ignore: cast_nullable_to_non_nullable
              as bool,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$CalendarEventImplCopyWith<$Res>
    implements $CalendarEventCopyWith<$Res> {
  factory _$$CalendarEventImplCopyWith(
          _$CalendarEventImpl value, $Res Function(_$CalendarEventImpl) then) =
      __$$CalendarEventImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {int id,
      @JsonKey(name: 'id_offre') int idOffre,
      @JsonKey(name: 'offre_titre') String? offreTitre,
      @JsonKey(name: 'date_entretien') String dateEntretien,
      @JsonKey(name: 'duree_minutes') int dureeMinutes,
      String lieu,
      @JsonKey(name: 'type_entretien') String typeEntretien,
      @JsonKey(name: 'lien_visio') String? lienVisio,
      @JsonKey(name: 'notes_rh') String? notesRh,
      String statut,
      @JsonKey(name: 'candidat_nom') String? candidatNom,
      @JsonKey(name: 'candidat_prenom') String? candidatPrenom,
      @JsonKey(name: 'candidat_email') String? candidatEmail,
      @JsonKey(name: 'email_candidat_envoye') bool emailCandidatEnvoye});
}

/// @nodoc
class __$$CalendarEventImplCopyWithImpl<$Res>
    extends _$CalendarEventCopyWithImpl<$Res, _$CalendarEventImpl>
    implements _$$CalendarEventImplCopyWith<$Res> {
  __$$CalendarEventImplCopyWithImpl(
      _$CalendarEventImpl _value, $Res Function(_$CalendarEventImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? idOffre = null,
    Object? offreTitre = freezed,
    Object? dateEntretien = null,
    Object? dureeMinutes = null,
    Object? lieu = null,
    Object? typeEntretien = null,
    Object? lienVisio = freezed,
    Object? notesRh = freezed,
    Object? statut = null,
    Object? candidatNom = freezed,
    Object? candidatPrenom = freezed,
    Object? candidatEmail = freezed,
    Object? emailCandidatEnvoye = null,
  }) {
    return _then(_$CalendarEventImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      idOffre: null == idOffre
          ? _value.idOffre
          : idOffre // ignore: cast_nullable_to_non_nullable
              as int,
      offreTitre: freezed == offreTitre
          ? _value.offreTitre
          : offreTitre // ignore: cast_nullable_to_non_nullable
              as String?,
      dateEntretien: null == dateEntretien
          ? _value.dateEntretien
          : dateEntretien // ignore: cast_nullable_to_non_nullable
              as String,
      dureeMinutes: null == dureeMinutes
          ? _value.dureeMinutes
          : dureeMinutes // ignore: cast_nullable_to_non_nullable
              as int,
      lieu: null == lieu
          ? _value.lieu
          : lieu // ignore: cast_nullable_to_non_nullable
              as String,
      typeEntretien: null == typeEntretien
          ? _value.typeEntretien
          : typeEntretien // ignore: cast_nullable_to_non_nullable
              as String,
      lienVisio: freezed == lienVisio
          ? _value.lienVisio
          : lienVisio // ignore: cast_nullable_to_non_nullable
              as String?,
      notesRh: freezed == notesRh
          ? _value.notesRh
          : notesRh // ignore: cast_nullable_to_non_nullable
              as String?,
      statut: null == statut
          ? _value.statut
          : statut // ignore: cast_nullable_to_non_nullable
              as String,
      candidatNom: freezed == candidatNom
          ? _value.candidatNom
          : candidatNom // ignore: cast_nullable_to_non_nullable
              as String?,
      candidatPrenom: freezed == candidatPrenom
          ? _value.candidatPrenom
          : candidatPrenom // ignore: cast_nullable_to_non_nullable
              as String?,
      candidatEmail: freezed == candidatEmail
          ? _value.candidatEmail
          : candidatEmail // ignore: cast_nullable_to_non_nullable
              as String?,
      emailCandidatEnvoye: null == emailCandidatEnvoye
          ? _value.emailCandidatEnvoye
          : emailCandidatEnvoye // ignore: cast_nullable_to_non_nullable
              as bool,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$CalendarEventImpl implements _CalendarEvent {
  const _$CalendarEventImpl(
      {required this.id,
      @JsonKey(name: 'id_offre') this.idOffre = 0,
      @JsonKey(name: 'offre_titre') this.offreTitre,
      @JsonKey(name: 'date_entretien') required this.dateEntretien,
      @JsonKey(name: 'duree_minutes') this.dureeMinutes = 30,
      this.lieu = '',
      @JsonKey(name: 'type_entretien') this.typeEntretien = 'presentiel',
      @JsonKey(name: 'lien_visio') this.lienVisio,
      @JsonKey(name: 'notes_rh') this.notesRh,
      this.statut = 'PLANIFIE',
      @JsonKey(name: 'candidat_nom') this.candidatNom,
      @JsonKey(name: 'candidat_prenom') this.candidatPrenom,
      @JsonKey(name: 'candidat_email') this.candidatEmail,
      @JsonKey(name: 'email_candidat_envoye')
      this.emailCandidatEnvoye = false});

  factory _$CalendarEventImpl.fromJson(Map<String, dynamic> json) =>
      _$$CalendarEventImplFromJson(json);

  @override
  final int id;
  @override
  @JsonKey(name: 'id_offre')
  final int idOffre;
  @override
  @JsonKey(name: 'offre_titre')
  final String? offreTitre;
  @override
  @JsonKey(name: 'date_entretien')
  final String dateEntretien;
  @override
  @JsonKey(name: 'duree_minutes')
  final int dureeMinutes;
  @override
  @JsonKey()
  final String lieu;
  @override
  @JsonKey(name: 'type_entretien')
  final String typeEntretien;
  @override
  @JsonKey(name: 'lien_visio')
  final String? lienVisio;
  @override
  @JsonKey(name: 'notes_rh')
  final String? notesRh;
  @override
  @JsonKey()
  final String statut;
  @override
  @JsonKey(name: 'candidat_nom')
  final String? candidatNom;
  @override
  @JsonKey(name: 'candidat_prenom')
  final String? candidatPrenom;
  @override
  @JsonKey(name: 'candidat_email')
  final String? candidatEmail;
  @override
  @JsonKey(name: 'email_candidat_envoye')
  final bool emailCandidatEnvoye;

  @override
  String toString() {
    return 'CalendarEvent(id: $id, idOffre: $idOffre, offreTitre: $offreTitre, dateEntretien: $dateEntretien, dureeMinutes: $dureeMinutes, lieu: $lieu, typeEntretien: $typeEntretien, lienVisio: $lienVisio, notesRh: $notesRh, statut: $statut, candidatNom: $candidatNom, candidatPrenom: $candidatPrenom, candidatEmail: $candidatEmail, emailCandidatEnvoye: $emailCandidatEnvoye)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CalendarEventImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.idOffre, idOffre) || other.idOffre == idOffre) &&
            (identical(other.offreTitre, offreTitre) ||
                other.offreTitre == offreTitre) &&
            (identical(other.dateEntretien, dateEntretien) ||
                other.dateEntretien == dateEntretien) &&
            (identical(other.dureeMinutes, dureeMinutes) ||
                other.dureeMinutes == dureeMinutes) &&
            (identical(other.lieu, lieu) || other.lieu == lieu) &&
            (identical(other.typeEntretien, typeEntretien) ||
                other.typeEntretien == typeEntretien) &&
            (identical(other.lienVisio, lienVisio) ||
                other.lienVisio == lienVisio) &&
            (identical(other.notesRh, notesRh) || other.notesRh == notesRh) &&
            (identical(other.statut, statut) || other.statut == statut) &&
            (identical(other.candidatNom, candidatNom) ||
                other.candidatNom == candidatNom) &&
            (identical(other.candidatPrenom, candidatPrenom) ||
                other.candidatPrenom == candidatPrenom) &&
            (identical(other.candidatEmail, candidatEmail) ||
                other.candidatEmail == candidatEmail) &&
            (identical(other.emailCandidatEnvoye, emailCandidatEnvoye) ||
                other.emailCandidatEnvoye == emailCandidatEnvoye));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      idOffre,
      offreTitre,
      dateEntretien,
      dureeMinutes,
      lieu,
      typeEntretien,
      lienVisio,
      notesRh,
      statut,
      candidatNom,
      candidatPrenom,
      candidatEmail,
      emailCandidatEnvoye);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$CalendarEventImplCopyWith<_$CalendarEventImpl> get copyWith =>
      __$$CalendarEventImplCopyWithImpl<_$CalendarEventImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$CalendarEventImplToJson(
      this,
    );
  }
}

abstract class _CalendarEvent implements CalendarEvent {
  const factory _CalendarEvent(
      {required final int id,
      @JsonKey(name: 'id_offre') final int idOffre,
      @JsonKey(name: 'offre_titre') final String? offreTitre,
      @JsonKey(name: 'date_entretien') required final String dateEntretien,
      @JsonKey(name: 'duree_minutes') final int dureeMinutes,
      final String lieu,
      @JsonKey(name: 'type_entretien') final String typeEntretien,
      @JsonKey(name: 'lien_visio') final String? lienVisio,
      @JsonKey(name: 'notes_rh') final String? notesRh,
      final String statut,
      @JsonKey(name: 'candidat_nom') final String? candidatNom,
      @JsonKey(name: 'candidat_prenom') final String? candidatPrenom,
      @JsonKey(name: 'candidat_email') final String? candidatEmail,
      @JsonKey(name: 'email_candidat_envoye')
      final bool emailCandidatEnvoye}) = _$CalendarEventImpl;

  factory _CalendarEvent.fromJson(Map<String, dynamic> json) =
      _$CalendarEventImpl.fromJson;

  @override
  int get id;
  @override
  @JsonKey(name: 'id_offre')
  int get idOffre;
  @override
  @JsonKey(name: 'offre_titre')
  String? get offreTitre;
  @override
  @JsonKey(name: 'date_entretien')
  String get dateEntretien;
  @override
  @JsonKey(name: 'duree_minutes')
  int get dureeMinutes;
  @override
  String get lieu;
  @override
  @JsonKey(name: 'type_entretien')
  String get typeEntretien;
  @override
  @JsonKey(name: 'lien_visio')
  String? get lienVisio;
  @override
  @JsonKey(name: 'notes_rh')
  String? get notesRh;
  @override
  String get statut;
  @override
  @JsonKey(name: 'candidat_nom')
  String? get candidatNom;
  @override
  @JsonKey(name: 'candidat_prenom')
  String? get candidatPrenom;
  @override
  @JsonKey(name: 'candidat_email')
  String? get candidatEmail;
  @override
  @JsonKey(name: 'email_candidat_envoye')
  bool get emailCandidatEnvoye;
  @override
  @JsonKey(ignore: true)
  _$$CalendarEventImplCopyWith<_$CalendarEventImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
