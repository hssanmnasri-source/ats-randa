import '../core/api_client.dart';
import '../models/candidate_cv.dart';

class CandidateCvRepository {
  /// GET /api/candidate/cvs
  Future<List<CandidateCV>> listCvs() async {
    final response = await dio.get('/api/candidate/cvs');
    final data = response.data as Map<String, dynamic>;
    final list = data['cvs'] as List? ?? [];
    return list
        .map((e) => CandidateCV.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// GET /api/candidate/cvs/{id}
  Future<CandidateCV> getCv(int id) async {
    final response = await dio.get('/api/candidate/cvs/$id');
    return CandidateCV.fromJson(response.data as Map<String, dynamic>);
  }
}
