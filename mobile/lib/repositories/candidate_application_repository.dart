import '../core/api_client.dart';
import '../models/application.dart';

class CandidateApplicationRepository {
  /// GET /api/candidate/applications
  Future<List<Application>> listApplications({int page = 1}) async {
    final response = await dio.get(
      '/api/candidate/applications',
      queryParameters: {'page': page, 'limit': 50},
    );
    final data = response.data as Map<String, dynamic>;
    final list = data['candidatures'] as List? ?? [];
    return list
        .map((e) => Application.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// GET /api/candidate/applications/{id}/detail
  Future<ApplicationDetail> getDetail(int id) async {
    final response = await dio.get('/api/candidate/applications/$id/detail');
    return ApplicationDetail.fromJson(response.data as Map<String, dynamic>);
  }

  /// POST /api/candidate/offers/{offerId}/apply
  Future<Map<String, dynamic>> apply(int offerId) async {
    final response = await dio.post('/api/candidate/offers/$offerId/apply');
    return response.data as Map<String, dynamic>;
  }

  /// DELETE /api/candidate/applications/{id}
  Future<void> withdraw(int id) async {
    await dio.delete('/api/candidate/applications/$id');
  }
}
