import '../core/api_client.dart';
import '../models/public_offer.dart';

class CandidateOfferRepository {
  /// GET /api/visitor/offers — public, no auth required
  Future<List<PublicOffer>> listOffers({String? search, int page = 1}) async {
    final response = await dio.get(
      '/api/visitor/offers',
      queryParameters: {
        'page': page,
        'limit': 30,
        if (search != null && search.isNotEmpty) 'search': search,
      },
    );
    final data = response.data as Map<String, dynamic>;
    final list = data['offers'] as List? ?? [];
    return list
        .map((e) => PublicOffer.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// GET /api/visitor/offers/{id}
  Future<PublicOffer> getOffer(int id) async {
    final response = await dio.get('/api/visitor/offers/$id');
    return PublicOffer.fromJson(response.data as Map<String, dynamic>);
  }
}
