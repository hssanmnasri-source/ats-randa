import '../core/api_client.dart';
import '../models/job_offer.dart';

class OffersRepository {
  /// GET /api/rh/offers — list RH offers with optional filters
  Future<JobOfferListResponse> getOffers({
    String? statut,
    int page = 1,
    int limit = 50,
  }) async {
    final response = await dio.get(
      '/api/rh/offers',
      queryParameters: {
        'page': page,
        'limit': limit,
        if (statut != null && statut.isNotEmpty) 'statut': statut,
      },
    );
    return JobOfferListResponse.fromJson(response.data as Map<String, dynamic>);
  }

  /// GET /api/rh/offers/{id}
  Future<JobOffer> getOffer(int id) async {
    final response = await dio.get('/api/rh/offers/$id');
    return JobOffer.fromJson(response.data as Map<String, dynamic>);
  }

  /// POST /api/rh/offers
  Future<JobOffer> createOffer(Map<String, dynamic> data) async {
    final response = await dio.post('/api/rh/offers', data: data);
    return JobOffer.fromJson(response.data as Map<String, dynamic>);
  }

  /// PUT /api/rh/offers/{id}
  Future<JobOffer> updateOffer(int id, Map<String, dynamic> data) async {
    final response = await dio.put('/api/rh/offers/$id', data: data);
    return JobOffer.fromJson(response.data as Map<String, dynamic>);
  }

  /// DELETE /api/rh/offers/{id}
  Future<void> deleteOffer(int id) async {
    await dio.delete('/api/rh/offers/$id');
  }
}
