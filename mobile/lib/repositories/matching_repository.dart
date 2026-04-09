import '../core/api_client.dart';
import '../models/matching_result.dart';

class MatchingRepository {
  /// POST /api/rh/offers/{offerId}/matching — launch matching (runs synchronously)
  Future<MatchingResponse> triggerMatching(int offerId, {int topN = 50}) async {
    final response = await dio.post(
      '/api/rh/offers/$offerId/matching',
      queryParameters: {'top_n': topN},
    );
    return MatchingResponse.fromJson(response.data as Map<String, dynamic>);
  }

  /// GET /api/rh/offers/{offerId}/matching — fetch stored matching results
  Future<MatchingResponse> getResults(int offerId, {String? decision, int limit = 50}) async {
    final response = await dio.get(
      '/api/rh/offers/$offerId/matching',
      queryParameters: {
        'limit': limit,
        if (decision != null) 'decision': decision,
      },
    );
    return MatchingResponse.fromJson(response.data as Map<String, dynamic>);
  }

  /// PATCH /api/rh/offers/{offerId}/matching/{resultId} — make decision
  Future<void> makeDecision(
    int offerId,
    int resultId,
    String decision, {
    String? feedbackRh,
    bool feedbackVisible = false,
  }) async {
    await dio.patch(
      '/api/rh/offers/$offerId/matching/$resultId',
      data: {
        'decision': decision,
        if (feedbackRh != null) 'feedback_rh': feedbackRh,
        'feedback_visible': feedbackVisible,
      },
    );
  }
}
