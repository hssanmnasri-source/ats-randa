import 'package:freezed_annotation/freezed_annotation.dart';

part 'rh_user.freezed.dart';
part 'rh_user.g.dart';

@freezed
class RhUser with _$RhUser {
  const factory RhUser({
    required int id,
    required String email,
    @Default('') String nom,
    @Default('') String prenom,
    @Default('rh') String role,
  }) = _RhUser;

  factory RhUser.fromJson(Map<String, dynamic> json) => _$RhUserFromJson(json);
}
