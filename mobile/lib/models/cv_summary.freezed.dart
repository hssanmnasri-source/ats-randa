// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'cv_summary.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

CvSummary _$CvSummaryFromJson(Map<String, dynamic> json) {
  return _CvSummary.fromJson(json);
}

/// @nodoc
mixin _$CvSummary {
  @JsonKey(name: 'cv_id')
  int get cvId => throw _privateConstructorUsedError;
  String get nom => throw _privateConstructorUsedError;
  String get prenom => throw _privateConstructorUsedError;
  String get email => throw _privateConstructorUsedError;
  String? get telephone => throw _privateConstructorUsedError;
  String? get source => throw _privateConstructorUsedError;
  double get score => throw _privateConstructorUsedError;
  String get extrait => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $CvSummaryCopyWith<CvSummary> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CvSummaryCopyWith<$Res> {
  factory $CvSummaryCopyWith(CvSummary value, $Res Function(CvSummary) then) =
      _$CvSummaryCopyWithImpl<$Res, CvSummary>;
  @useResult
  $Res call(
      {@JsonKey(name: 'cv_id') int cvId,
      String nom,
      String prenom,
      String email,
      String? telephone,
      String? source,
      double score,
      String extrait});
}

/// @nodoc
class _$CvSummaryCopyWithImpl<$Res, $Val extends CvSummary>
    implements $CvSummaryCopyWith<$Res> {
  _$CvSummaryCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? cvId = null,
    Object? nom = null,
    Object? prenom = null,
    Object? email = null,
    Object? telephone = freezed,
    Object? source = freezed,
    Object? score = null,
    Object? extrait = null,
  }) {
    return _then(_value.copyWith(
      cvId: null == cvId
          ? _value.cvId
          : cvId // ignore: cast_nullable_to_non_nullable
              as int,
      nom: null == nom
          ? _value.nom
          : nom // ignore: cast_nullable_to_non_nullable
              as String,
      prenom: null == prenom
          ? _value.prenom
          : prenom // ignore: cast_nullable_to_non_nullable
              as String,
      email: null == email
          ? _value.email
          : email // ignore: cast_nullable_to_non_nullable
              as String,
      telephone: freezed == telephone
          ? _value.telephone
          : telephone // ignore: cast_nullable_to_non_nullable
              as String?,
      source: freezed == source
          ? _value.source
          : source // ignore: cast_nullable_to_non_nullable
              as String?,
      score: null == score
          ? _value.score
          : score // ignore: cast_nullable_to_non_nullable
              as double,
      extrait: null == extrait
          ? _value.extrait
          : extrait // ignore: cast_nullable_to_non_nullable
              as String,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$CvSummaryImplCopyWith<$Res>
    implements $CvSummaryCopyWith<$Res> {
  factory _$$CvSummaryImplCopyWith(
          _$CvSummaryImpl value, $Res Function(_$CvSummaryImpl) then) =
      __$$CvSummaryImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {@JsonKey(name: 'cv_id') int cvId,
      String nom,
      String prenom,
      String email,
      String? telephone,
      String? source,
      double score,
      String extrait});
}

/// @nodoc
class __$$CvSummaryImplCopyWithImpl<$Res>
    extends _$CvSummaryCopyWithImpl<$Res, _$CvSummaryImpl>
    implements _$$CvSummaryImplCopyWith<$Res> {
  __$$CvSummaryImplCopyWithImpl(
      _$CvSummaryImpl _value, $Res Function(_$CvSummaryImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? cvId = null,
    Object? nom = null,
    Object? prenom = null,
    Object? email = null,
    Object? telephone = freezed,
    Object? source = freezed,
    Object? score = null,
    Object? extrait = null,
  }) {
    return _then(_$CvSummaryImpl(
      cvId: null == cvId
          ? _value.cvId
          : cvId // ignore: cast_nullable_to_non_nullable
              as int,
      nom: null == nom
          ? _value.nom
          : nom // ignore: cast_nullable_to_non_nullable
              as String,
      prenom: null == prenom
          ? _value.prenom
          : prenom // ignore: cast_nullable_to_non_nullable
              as String,
      email: null == email
          ? _value.email
          : email // ignore: cast_nullable_to_non_nullable
              as String,
      telephone: freezed == telephone
          ? _value.telephone
          : telephone // ignore: cast_nullable_to_non_nullable
              as String?,
      source: freezed == source
          ? _value.source
          : source // ignore: cast_nullable_to_non_nullable
              as String?,
      score: null == score
          ? _value.score
          : score // ignore: cast_nullable_to_non_nullable
              as double,
      extrait: null == extrait
          ? _value.extrait
          : extrait // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$CvSummaryImpl implements _CvSummary {
  const _$CvSummaryImpl(
      {@JsonKey(name: 'cv_id') required this.cvId,
      this.nom = '',
      this.prenom = '',
      this.email = '',
      this.telephone,
      this.source,
      this.score = 0.0,
      this.extrait = ''});

  factory _$CvSummaryImpl.fromJson(Map<String, dynamic> json) =>
      _$$CvSummaryImplFromJson(json);

  @override
  @JsonKey(name: 'cv_id')
  final int cvId;
  @override
  @JsonKey()
  final String nom;
  @override
  @JsonKey()
  final String prenom;
  @override
  @JsonKey()
  final String email;
  @override
  final String? telephone;
  @override
  final String? source;
  @override
  @JsonKey()
  final double score;
  @override
  @JsonKey()
  final String extrait;

  @override
  String toString() {
    return 'CvSummary(cvId: $cvId, nom: $nom, prenom: $prenom, email: $email, telephone: $telephone, source: $source, score: $score, extrait: $extrait)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CvSummaryImpl &&
            (identical(other.cvId, cvId) || other.cvId == cvId) &&
            (identical(other.nom, nom) || other.nom == nom) &&
            (identical(other.prenom, prenom) || other.prenom == prenom) &&
            (identical(other.email, email) || other.email == email) &&
            (identical(other.telephone, telephone) ||
                other.telephone == telephone) &&
            (identical(other.source, source) || other.source == source) &&
            (identical(other.score, score) || other.score == score) &&
            (identical(other.extrait, extrait) || other.extrait == extrait));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType, cvId, nom, prenom, email, telephone, source, score, extrait);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$CvSummaryImplCopyWith<_$CvSummaryImpl> get copyWith =>
      __$$CvSummaryImplCopyWithImpl<_$CvSummaryImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$CvSummaryImplToJson(
      this,
    );
  }
}

abstract class _CvSummary implements CvSummary {
  const factory _CvSummary(
      {@JsonKey(name: 'cv_id') required final int cvId,
      final String nom,
      final String prenom,
      final String email,
      final String? telephone,
      final String? source,
      final double score,
      final String extrait}) = _$CvSummaryImpl;

  factory _CvSummary.fromJson(Map<String, dynamic> json) =
      _$CvSummaryImpl.fromJson;

  @override
  @JsonKey(name: 'cv_id')
  int get cvId;
  @override
  String get nom;
  @override
  String get prenom;
  @override
  String get email;
  @override
  String? get telephone;
  @override
  String? get source;
  @override
  double get score;
  @override
  String get extrait;
  @override
  @JsonKey(ignore: true)
  _$$CvSummaryImplCopyWith<_$CvSummaryImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

CvSearchResponse _$CvSearchResponseFromJson(Map<String, dynamic> json) {
  return _CvSearchResponse.fromJson(json);
}

/// @nodoc
mixin _$CvSearchResponse {
  String get query => throw _privateConstructorUsedError;
  int get total => throw _privateConstructorUsedError;
  List<CvSummary> get results => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $CvSearchResponseCopyWith<CvSearchResponse> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CvSearchResponseCopyWith<$Res> {
  factory $CvSearchResponseCopyWith(
          CvSearchResponse value, $Res Function(CvSearchResponse) then) =
      _$CvSearchResponseCopyWithImpl<$Res, CvSearchResponse>;
  @useResult
  $Res call({String query, int total, List<CvSummary> results});
}

/// @nodoc
class _$CvSearchResponseCopyWithImpl<$Res, $Val extends CvSearchResponse>
    implements $CvSearchResponseCopyWith<$Res> {
  _$CvSearchResponseCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? query = null,
    Object? total = null,
    Object? results = null,
  }) {
    return _then(_value.copyWith(
      query: null == query
          ? _value.query
          : query // ignore: cast_nullable_to_non_nullable
              as String,
      total: null == total
          ? _value.total
          : total // ignore: cast_nullable_to_non_nullable
              as int,
      results: null == results
          ? _value.results
          : results // ignore: cast_nullable_to_non_nullable
              as List<CvSummary>,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$CvSearchResponseImplCopyWith<$Res>
    implements $CvSearchResponseCopyWith<$Res> {
  factory _$$CvSearchResponseImplCopyWith(_$CvSearchResponseImpl value,
          $Res Function(_$CvSearchResponseImpl) then) =
      __$$CvSearchResponseImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String query, int total, List<CvSummary> results});
}

/// @nodoc
class __$$CvSearchResponseImplCopyWithImpl<$Res>
    extends _$CvSearchResponseCopyWithImpl<$Res, _$CvSearchResponseImpl>
    implements _$$CvSearchResponseImplCopyWith<$Res> {
  __$$CvSearchResponseImplCopyWithImpl(_$CvSearchResponseImpl _value,
      $Res Function(_$CvSearchResponseImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? query = null,
    Object? total = null,
    Object? results = null,
  }) {
    return _then(_$CvSearchResponseImpl(
      query: null == query
          ? _value.query
          : query // ignore: cast_nullable_to_non_nullable
              as String,
      total: null == total
          ? _value.total
          : total // ignore: cast_nullable_to_non_nullable
              as int,
      results: null == results
          ? _value._results
          : results // ignore: cast_nullable_to_non_nullable
              as List<CvSummary>,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$CvSearchResponseImpl implements _CvSearchResponse {
  const _$CvSearchResponseImpl(
      {this.query = '',
      this.total = 0,
      final List<CvSummary> results = const []})
      : _results = results;

  factory _$CvSearchResponseImpl.fromJson(Map<String, dynamic> json) =>
      _$$CvSearchResponseImplFromJson(json);

  @override
  @JsonKey()
  final String query;
  @override
  @JsonKey()
  final int total;
  final List<CvSummary> _results;
  @override
  @JsonKey()
  List<CvSummary> get results {
    if (_results is EqualUnmodifiableListView) return _results;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_results);
  }

  @override
  String toString() {
    return 'CvSearchResponse(query: $query, total: $total, results: $results)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CvSearchResponseImpl &&
            (identical(other.query, query) || other.query == query) &&
            (identical(other.total, total) || other.total == total) &&
            const DeepCollectionEquality().equals(other._results, _results));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType, query, total, const DeepCollectionEquality().hash(_results));

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$CvSearchResponseImplCopyWith<_$CvSearchResponseImpl> get copyWith =>
      __$$CvSearchResponseImplCopyWithImpl<_$CvSearchResponseImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$CvSearchResponseImplToJson(
      this,
    );
  }
}

abstract class _CvSearchResponse implements CvSearchResponse {
  const factory _CvSearchResponse(
      {final String query,
      final int total,
      final List<CvSummary> results}) = _$CvSearchResponseImpl;

  factory _CvSearchResponse.fromJson(Map<String, dynamic> json) =
      _$CvSearchResponseImpl.fromJson;

  @override
  String get query;
  @override
  int get total;
  @override
  List<CvSummary> get results;
  @override
  @JsonKey(ignore: true)
  _$$CvSearchResponseImplCopyWith<_$CvSearchResponseImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
