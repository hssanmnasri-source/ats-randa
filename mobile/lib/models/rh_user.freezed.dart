// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'rh_user.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

RhUser _$RhUserFromJson(Map<String, dynamic> json) {
  return _RhUser.fromJson(json);
}

/// @nodoc
mixin _$RhUser {
  int get id => throw _privateConstructorUsedError;
  String get email => throw _privateConstructorUsedError;
  String get nom => throw _privateConstructorUsedError;
  String get prenom => throw _privateConstructorUsedError;
  String get role => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $RhUserCopyWith<RhUser> get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $RhUserCopyWith<$Res> {
  factory $RhUserCopyWith(RhUser value, $Res Function(RhUser) then) =
      _$RhUserCopyWithImpl<$Res, RhUser>;
  @useResult
  $Res call({int id, String email, String nom, String prenom, String role});
}

/// @nodoc
class _$RhUserCopyWithImpl<$Res, $Val extends RhUser>
    implements $RhUserCopyWith<$Res> {
  _$RhUserCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? email = null,
    Object? nom = null,
    Object? prenom = null,
    Object? role = null,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      email: null == email
          ? _value.email
          : email // ignore: cast_nullable_to_non_nullable
              as String,
      nom: null == nom
          ? _value.nom
          : nom // ignore: cast_nullable_to_non_nullable
              as String,
      prenom: null == prenom
          ? _value.prenom
          : prenom // ignore: cast_nullable_to_non_nullable
              as String,
      role: null == role
          ? _value.role
          : role // ignore: cast_nullable_to_non_nullable
              as String,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$RhUserImplCopyWith<$Res> implements $RhUserCopyWith<$Res> {
  factory _$$RhUserImplCopyWith(
          _$RhUserImpl value, $Res Function(_$RhUserImpl) then) =
      __$$RhUserImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({int id, String email, String nom, String prenom, String role});
}

/// @nodoc
class __$$RhUserImplCopyWithImpl<$Res>
    extends _$RhUserCopyWithImpl<$Res, _$RhUserImpl>
    implements _$$RhUserImplCopyWith<$Res> {
  __$$RhUserImplCopyWithImpl(
      _$RhUserImpl _value, $Res Function(_$RhUserImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? email = null,
    Object? nom = null,
    Object? prenom = null,
    Object? role = null,
  }) {
    return _then(_$RhUserImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      email: null == email
          ? _value.email
          : email // ignore: cast_nullable_to_non_nullable
              as String,
      nom: null == nom
          ? _value.nom
          : nom // ignore: cast_nullable_to_non_nullable
              as String,
      prenom: null == prenom
          ? _value.prenom
          : prenom // ignore: cast_nullable_to_non_nullable
              as String,
      role: null == role
          ? _value.role
          : role // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$RhUserImpl implements _RhUser {
  const _$RhUserImpl(
      {required this.id,
      required this.email,
      this.nom = '',
      this.prenom = '',
      this.role = 'rh'});

  factory _$RhUserImpl.fromJson(Map<String, dynamic> json) =>
      _$$RhUserImplFromJson(json);

  @override
  final int id;
  @override
  final String email;
  @override
  @JsonKey()
  final String nom;
  @override
  @JsonKey()
  final String prenom;
  @override
  @JsonKey()
  final String role;

  @override
  String toString() {
    return 'RhUser(id: $id, email: $email, nom: $nom, prenom: $prenom, role: $role)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$RhUserImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.email, email) || other.email == email) &&
            (identical(other.nom, nom) || other.nom == nom) &&
            (identical(other.prenom, prenom) || other.prenom == prenom) &&
            (identical(other.role, role) || other.role == role));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, id, email, nom, prenom, role);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$RhUserImplCopyWith<_$RhUserImpl> get copyWith =>
      __$$RhUserImplCopyWithImpl<_$RhUserImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$RhUserImplToJson(
      this,
    );
  }
}

abstract class _RhUser implements RhUser {
  const factory _RhUser(
      {required final int id,
      required final String email,
      final String nom,
      final String prenom,
      final String role}) = _$RhUserImpl;

  factory _RhUser.fromJson(Map<String, dynamic> json) = _$RhUserImpl.fromJson;

  @override
  int get id;
  @override
  String get email;
  @override
  String get nom;
  @override
  String get prenom;
  @override
  String get role;
  @override
  @JsonKey(ignore: true)
  _$$RhUserImplCopyWith<_$RhUserImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
