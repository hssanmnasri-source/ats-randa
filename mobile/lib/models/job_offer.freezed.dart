// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'job_offer.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

JobOffer _$JobOfferFromJson(Map<String, dynamic> json) {
  return _JobOffer.fromJson(json);
}

/// @nodoc
mixin _$JobOffer {
  int get id => throw _privateConstructorUsedError;
  String get titre => throw _privateConstructorUsedError;
  String get description => throw _privateConstructorUsedError;
  @JsonKey(name: 'competences_requises')
  List<String> get competencesRequises => throw _privateConstructorUsedError;
  @JsonKey(name: 'experience_requise')
  double get experienceRequise => throw _privateConstructorUsedError;
  @JsonKey(name: 'langue_requise')
  String get langueRequise => throw _privateConstructorUsedError;
  @JsonKey(name: 'date_publication')
  String get datePublication => throw _privateConstructorUsedError;
  @JsonKey(name: 'plateforme_source')
  String get plateformeSource => throw _privateConstructorUsedError;
  String get statut => throw _privateConstructorUsedError;
  @JsonKey(name: 'id_rh')
  int? get idRh => throw _privateConstructorUsedError;
  @JsonKey(name: 'seuil_alerte')
  int? get seuilAlerte => throw _privateConstructorUsedError;
  @JsonKey(name: 'matching_auto')
  bool get matchingAuto => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $JobOfferCopyWith<JobOffer> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $JobOfferCopyWith<$Res> {
  factory $JobOfferCopyWith(JobOffer value, $Res Function(JobOffer) then) =
      _$JobOfferCopyWithImpl<$Res, JobOffer>;
  @useResult
  $Res call(
      {int id,
      String titre,
      String description,
      @JsonKey(name: 'competences_requises') List<String> competencesRequises,
      @JsonKey(name: 'experience_requise') double experienceRequise,
      @JsonKey(name: 'langue_requise') String langueRequise,
      @JsonKey(name: 'date_publication') String datePublication,
      @JsonKey(name: 'plateforme_source') String plateformeSource,
      String statut,
      @JsonKey(name: 'id_rh') int? idRh,
      @JsonKey(name: 'seuil_alerte') int? seuilAlerte,
      @JsonKey(name: 'matching_auto') bool matchingAuto});
}

/// @nodoc
class _$JobOfferCopyWithImpl<$Res, $Val extends JobOffer>
    implements $JobOfferCopyWith<$Res> {
  _$JobOfferCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? titre = null,
    Object? description = null,
    Object? competencesRequises = null,
    Object? experienceRequise = null,
    Object? langueRequise = null,
    Object? datePublication = null,
    Object? plateformeSource = null,
    Object? statut = null,
    Object? idRh = freezed,
    Object? seuilAlerte = freezed,
    Object? matchingAuto = null,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      titre: null == titre
          ? _value.titre
          : titre // ignore: cast_nullable_to_non_nullable
              as String,
      description: null == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String,
      competencesRequises: null == competencesRequises
          ? _value.competencesRequises
          : competencesRequises // ignore: cast_nullable_to_non_nullable
              as List<String>,
      experienceRequise: null == experienceRequise
          ? _value.experienceRequise
          : experienceRequise // ignore: cast_nullable_to_non_nullable
              as double,
      langueRequise: null == langueRequise
          ? _value.langueRequise
          : langueRequise // ignore: cast_nullable_to_non_nullable
              as String,
      datePublication: null == datePublication
          ? _value.datePublication
          : datePublication // ignore: cast_nullable_to_non_nullable
              as String,
      plateformeSource: null == plateformeSource
          ? _value.plateformeSource
          : plateformeSource // ignore: cast_nullable_to_non_nullable
              as String,
      statut: null == statut
          ? _value.statut
          : statut // ignore: cast_nullable_to_non_nullable
              as String,
      idRh: freezed == idRh
          ? _value.idRh
          : idRh // ignore: cast_nullable_to_non_nullable
              as int?,
      seuilAlerte: freezed == seuilAlerte
          ? _value.seuilAlerte
          : seuilAlerte // ignore: cast_nullable_to_non_nullable
              as int?,
      matchingAuto: null == matchingAuto
          ? _value.matchingAuto
          : matchingAuto // ignore: cast_nullable_to_non_nullable
              as bool,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$JobOfferImplCopyWith<$Res>
    implements $JobOfferCopyWith<$Res> {
  factory _$$JobOfferImplCopyWith(
          _$JobOfferImpl value, $Res Function(_$JobOfferImpl) then) =
      __$$JobOfferImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {int id,
      String titre,
      String description,
      @JsonKey(name: 'competences_requises') List<String> competencesRequises,
      @JsonKey(name: 'experience_requise') double experienceRequise,
      @JsonKey(name: 'langue_requise') String langueRequise,
      @JsonKey(name: 'date_publication') String datePublication,
      @JsonKey(name: 'plateforme_source') String plateformeSource,
      String statut,
      @JsonKey(name: 'id_rh') int? idRh,
      @JsonKey(name: 'seuil_alerte') int? seuilAlerte,
      @JsonKey(name: 'matching_auto') bool matchingAuto});
}

/// @nodoc
class __$$JobOfferImplCopyWithImpl<$Res>
    extends _$JobOfferCopyWithImpl<$Res, _$JobOfferImpl>
    implements _$$JobOfferImplCopyWith<$Res> {
  __$$JobOfferImplCopyWithImpl(
      _$JobOfferImpl _value, $Res Function(_$JobOfferImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? titre = null,
    Object? description = null,
    Object? competencesRequises = null,
    Object? experienceRequise = null,
    Object? langueRequise = null,
    Object? datePublication = null,
    Object? plateformeSource = null,
    Object? statut = null,
    Object? idRh = freezed,
    Object? seuilAlerte = freezed,
    Object? matchingAuto = null,
  }) {
    return _then(_$JobOfferImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      titre: null == titre
          ? _value.titre
          : titre // ignore: cast_nullable_to_non_nullable
              as String,
      description: null == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String,
      competencesRequises: null == competencesRequises
          ? _value._competencesRequises
          : competencesRequises // ignore: cast_nullable_to_non_nullable
              as List<String>,
      experienceRequise: null == experienceRequise
          ? _value.experienceRequise
          : experienceRequise // ignore: cast_nullable_to_non_nullable
              as double,
      langueRequise: null == langueRequise
          ? _value.langueRequise
          : langueRequise // ignore: cast_nullable_to_non_nullable
              as String,
      datePublication: null == datePublication
          ? _value.datePublication
          : datePublication // ignore: cast_nullable_to_non_nullable
              as String,
      plateformeSource: null == plateformeSource
          ? _value.plateformeSource
          : plateformeSource // ignore: cast_nullable_to_non_nullable
              as String,
      statut: null == statut
          ? _value.statut
          : statut // ignore: cast_nullable_to_non_nullable
              as String,
      idRh: freezed == idRh
          ? _value.idRh
          : idRh // ignore: cast_nullable_to_non_nullable
              as int?,
      seuilAlerte: freezed == seuilAlerte
          ? _value.seuilAlerte
          : seuilAlerte // ignore: cast_nullable_to_non_nullable
              as int?,
      matchingAuto: null == matchingAuto
          ? _value.matchingAuto
          : matchingAuto // ignore: cast_nullable_to_non_nullable
              as bool,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$JobOfferImpl implements _JobOffer {
  const _$JobOfferImpl(
      {required this.id,
      required this.titre,
      this.description = '',
      @JsonKey(name: 'competences_requises')
      final List<String> competencesRequises = const [],
      @JsonKey(name: 'experience_requise') this.experienceRequise = 0.0,
      @JsonKey(name: 'langue_requise') this.langueRequise = '',
      @JsonKey(name: 'date_publication') this.datePublication = '',
      @JsonKey(name: 'plateforme_source') this.plateformeSource = '',
      this.statut = 'ACTIVE',
      @JsonKey(name: 'id_rh') this.idRh,
      @JsonKey(name: 'seuil_alerte') this.seuilAlerte,
      @JsonKey(name: 'matching_auto') this.matchingAuto = false})
      : _competencesRequises = competencesRequises;

  factory _$JobOfferImpl.fromJson(Map<String, dynamic> json) =>
      _$$JobOfferImplFromJson(json);

  @override
  final int id;
  @override
  final String titre;
  @override
  @JsonKey()
  final String description;
  final List<String> _competencesRequises;
  @override
  @JsonKey(name: 'competences_requises')
  List<String> get competencesRequises {
    if (_competencesRequises is EqualUnmodifiableListView)
      return _competencesRequises;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_competencesRequises);
  }

  @override
  @JsonKey(name: 'experience_requise')
  final double experienceRequise;
  @override
  @JsonKey(name: 'langue_requise')
  final String langueRequise;
  @override
  @JsonKey(name: 'date_publication')
  final String datePublication;
  @override
  @JsonKey(name: 'plateforme_source')
  final String plateformeSource;
  @override
  @JsonKey()
  final String statut;
  @override
  @JsonKey(name: 'id_rh')
  final int? idRh;
  @override
  @JsonKey(name: 'seuil_alerte')
  final int? seuilAlerte;
  @override
  @JsonKey(name: 'matching_auto')
  final bool matchingAuto;

  @override
  String toString() {
    return 'JobOffer(id: $id, titre: $titre, description: $description, competencesRequises: $competencesRequises, experienceRequise: $experienceRequise, langueRequise: $langueRequise, datePublication: $datePublication, plateformeSource: $plateformeSource, statut: $statut, idRh: $idRh, seuilAlerte: $seuilAlerte, matchingAuto: $matchingAuto)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$JobOfferImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.titre, titre) || other.titre == titre) &&
            (identical(other.description, description) ||
                other.description == description) &&
            const DeepCollectionEquality()
                .equals(other._competencesRequises, _competencesRequises) &&
            (identical(other.experienceRequise, experienceRequise) ||
                other.experienceRequise == experienceRequise) &&
            (identical(other.langueRequise, langueRequise) ||
                other.langueRequise == langueRequise) &&
            (identical(other.datePublication, datePublication) ||
                other.datePublication == datePublication) &&
            (identical(other.plateformeSource, plateformeSource) ||
                other.plateformeSource == plateformeSource) &&
            (identical(other.statut, statut) || other.statut == statut) &&
            (identical(other.idRh, idRh) || other.idRh == idRh) &&
            (identical(other.seuilAlerte, seuilAlerte) ||
                other.seuilAlerte == seuilAlerte) &&
            (identical(other.matchingAuto, matchingAuto) ||
                other.matchingAuto == matchingAuto));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      titre,
      description,
      const DeepCollectionEquality().hash(_competencesRequises),
      experienceRequise,
      langueRequise,
      datePublication,
      plateformeSource,
      statut,
      idRh,
      seuilAlerte,
      matchingAuto);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$JobOfferImplCopyWith<_$JobOfferImpl> get copyWith =>
      __$$JobOfferImplCopyWithImpl<_$JobOfferImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$JobOfferImplToJson(
      this,
    );
  }
}

abstract class _JobOffer implements JobOffer {
  const factory _JobOffer(
          {required final int id,
          required final String titre,
          final String description,
          @JsonKey(name: 'competences_requises')
          final List<String> competencesRequises,
          @JsonKey(name: 'experience_requise') final double experienceRequise,
          @JsonKey(name: 'langue_requise') final String langueRequise,
          @JsonKey(name: 'date_publication') final String datePublication,
          @JsonKey(name: 'plateforme_source') final String plateformeSource,
          final String statut,
          @JsonKey(name: 'id_rh') final int? idRh,
          @JsonKey(name: 'seuil_alerte') final int? seuilAlerte,
          @JsonKey(name: 'matching_auto') final bool matchingAuto}) =
      _$JobOfferImpl;

  factory _JobOffer.fromJson(Map<String, dynamic> json) =
      _$JobOfferImpl.fromJson;

  @override
  int get id;
  @override
  String get titre;
  @override
  String get description;
  @override
  @JsonKey(name: 'competences_requises')
  List<String> get competencesRequises;
  @override
  @JsonKey(name: 'experience_requise')
  double get experienceRequise;
  @override
  @JsonKey(name: 'langue_requise')
  String get langueRequise;
  @override
  @JsonKey(name: 'date_publication')
  String get datePublication;
  @override
  @JsonKey(name: 'plateforme_source')
  String get plateformeSource;
  @override
  String get statut;
  @override
  @JsonKey(name: 'id_rh')
  int? get idRh;
  @override
  @JsonKey(name: 'seuil_alerte')
  int? get seuilAlerte;
  @override
  @JsonKey(name: 'matching_auto')
  bool get matchingAuto;
  @override
  @JsonKey(ignore: true)
  _$$JobOfferImplCopyWith<_$JobOfferImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

JobOfferListResponse _$JobOfferListResponseFromJson(Map<String, dynamic> json) {
  return _JobOfferListResponse.fromJson(json);
}

/// @nodoc
mixin _$JobOfferListResponse {
  int get total => throw _privateConstructorUsedError;
  List<JobOffer> get offers => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $JobOfferListResponseCopyWith<JobOfferListResponse> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $JobOfferListResponseCopyWith<$Res> {
  factory $JobOfferListResponseCopyWith(JobOfferListResponse value,
          $Res Function(JobOfferListResponse) then) =
      _$JobOfferListResponseCopyWithImpl<$Res, JobOfferListResponse>;
  @useResult
  $Res call({int total, List<JobOffer> offers});
}

/// @nodoc
class _$JobOfferListResponseCopyWithImpl<$Res,
        $Val extends JobOfferListResponse>
    implements $JobOfferListResponseCopyWith<$Res> {
  _$JobOfferListResponseCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? total = null,
    Object? offers = null,
  }) {
    return _then(_value.copyWith(
      total: null == total
          ? _value.total
          : total // ignore: cast_nullable_to_non_nullable
              as int,
      offers: null == offers
          ? _value.offers
          : offers // ignore: cast_nullable_to_non_nullable
              as List<JobOffer>,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$JobOfferListResponseImplCopyWith<$Res>
    implements $JobOfferListResponseCopyWith<$Res> {
  factory _$$JobOfferListResponseImplCopyWith(_$JobOfferListResponseImpl value,
          $Res Function(_$JobOfferListResponseImpl) then) =
      __$$JobOfferListResponseImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({int total, List<JobOffer> offers});
}

/// @nodoc
class __$$JobOfferListResponseImplCopyWithImpl<$Res>
    extends _$JobOfferListResponseCopyWithImpl<$Res, _$JobOfferListResponseImpl>
    implements _$$JobOfferListResponseImplCopyWith<$Res> {
  __$$JobOfferListResponseImplCopyWithImpl(_$JobOfferListResponseImpl _value,
      $Res Function(_$JobOfferListResponseImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? total = null,
    Object? offers = null,
  }) {
    return _then(_$JobOfferListResponseImpl(
      total: null == total
          ? _value.total
          : total // ignore: cast_nullable_to_non_nullable
              as int,
      offers: null == offers
          ? _value._offers
          : offers // ignore: cast_nullable_to_non_nullable
              as List<JobOffer>,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$JobOfferListResponseImpl implements _JobOfferListResponse {
  const _$JobOfferListResponseImpl(
      {required this.total, required final List<JobOffer> offers})
      : _offers = offers;

  factory _$JobOfferListResponseImpl.fromJson(Map<String, dynamic> json) =>
      _$$JobOfferListResponseImplFromJson(json);

  @override
  final int total;
  final List<JobOffer> _offers;
  @override
  List<JobOffer> get offers {
    if (_offers is EqualUnmodifiableListView) return _offers;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_offers);
  }

  @override
  String toString() {
    return 'JobOfferListResponse(total: $total, offers: $offers)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$JobOfferListResponseImpl &&
            (identical(other.total, total) || other.total == total) &&
            const DeepCollectionEquality().equals(other._offers, _offers));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType, total, const DeepCollectionEquality().hash(_offers));

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$JobOfferListResponseImplCopyWith<_$JobOfferListResponseImpl>
      get copyWith =>
          __$$JobOfferListResponseImplCopyWithImpl<_$JobOfferListResponseImpl>(
              this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$JobOfferListResponseImplToJson(
      this,
    );
  }
}

abstract class _JobOfferListResponse implements JobOfferListResponse {
  const factory _JobOfferListResponse(
      {required final int total,
      required final List<JobOffer> offers}) = _$JobOfferListResponseImpl;

  factory _JobOfferListResponse.fromJson(Map<String, dynamic> json) =
      _$JobOfferListResponseImpl.fromJson;

  @override
  int get total;
  @override
  List<JobOffer> get offers;
  @override
  @JsonKey(ignore: true)
  _$$JobOfferListResponseImplCopyWith<_$JobOfferListResponseImpl>
      get copyWith => throw _privateConstructorUsedError;
}
