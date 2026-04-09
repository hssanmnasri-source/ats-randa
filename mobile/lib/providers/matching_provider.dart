import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/matching_result.dart';
import '../repositories/matching_repository.dart';

final matchingRepositoryProvider = Provider<MatchingRepository>(
  (ref) => MatchingRepository(),
);

final matchingResultsProvider =
    FutureProvider.autoDispose.family<MatchingResponse, int>((ref, offerId) async {
  return ref.read(matchingRepositoryProvider).getResults(offerId);
});
