import '../core/api_client.dart';
import '../models/candidate_profile.dart';

class CandidateProfileRepository {
  /// GET /api/candidate/profile/full
  Future<FullProfile> getFullProfile() async {
    final response = await dio.get('/api/candidate/profile/full');
    return FullProfile.fromJson(response.data as Map<String, dynamic>);
  }

  /// GET /api/candidate/profile
  Future<CandidateProfile> getProfile() async {
    final response = await dio.get('/api/candidate/profile');
    return CandidateProfile.fromJson(response.data as Map<String, dynamic>);
  }

  /// PUT /api/candidate/profile/personal
  Future<CandidateProfile> updatePersonal(Map<String, dynamic> data) async {
    final response = await dio.put('/api/candidate/profile/personal', data: data);
    return CandidateProfile.fromJson(response.data as Map<String, dynamic>);
  }

  /// PUT /api/candidate/profile/professional
  Future<CandidateProfile> updateProfessional(Map<String, dynamic> data) async {
    final response =
        await dio.put('/api/candidate/profile/professional', data: data);
    return CandidateProfile.fromJson(response.data as Map<String, dynamic>);
  }

  /// GET /api/candidate/profile/experiences
  Future<List<CandidateExperience>> getExperiences() async {
    final response = await dio.get('/api/candidate/profile/experiences');
    final list = response.data as List? ?? [];
    return list
        .map((e) => CandidateExperience.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// POST /api/candidate/profile/experiences
  Future<CandidateExperience> addExperience(Map<String, dynamic> data) async {
    final response =
        await dio.post('/api/candidate/profile/experiences', data: data);
    return CandidateExperience.fromJson(response.data as Map<String, dynamic>);
  }

  /// DELETE /api/candidate/profile/experiences/{id}
  Future<void> deleteExperience(int id) async {
    await dio.delete('/api/candidate/profile/experiences/$id');
  }

  /// GET /api/candidate/profile/skills
  Future<List<CandidateSkill>> getSkills() async {
    final response = await dio.get('/api/candidate/profile/skills');
    final list = response.data as List? ?? [];
    return list
        .map((e) => CandidateSkill.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// POST /api/candidate/profile/skills
  Future<CandidateSkill> addSkill(String nom, {String? niveau}) async {
    final response = await dio.post('/api/candidate/profile/skills',
        data: {'nom': nom, if (niveau != null) 'niveau': niveau});
    return CandidateSkill.fromJson(response.data as Map<String, dynamic>);
  }

  /// DELETE /api/candidate/profile/skills/{id}
  Future<void> deleteSkill(int id) async {
    await dio.delete('/api/candidate/profile/skills/$id');
  }
}
