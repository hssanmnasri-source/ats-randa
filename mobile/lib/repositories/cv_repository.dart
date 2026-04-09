import '../core/api_client.dart';
import '../models/cv_summary.dart';

class CvthequeRepository {
  /// GET /api/rh/cvs/search?q= — semantic CV search
  Future<CvSearchResponse> searchCVs(String query) async {
    final response = await dio.get(
      '/api/rh/cvs/search',
      queryParameters: {'q': query, 'limit': 20},
    );
    return CvSearchResponse.fromJson(response.data as Map<String, dynamic>);
  }
}
