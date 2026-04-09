import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/cv_summary.dart';
import '../repositories/cv_repository.dart';

final cvthequeRepositoryProvider = Provider<CvthequeRepository>(
  (ref) => CvthequeRepository(),
);

final cvSearchQueryProvider = StateProvider<String>((ref) => '');

final cvthequeProvider = FutureProvider.autoDispose<CvSearchResponse>((ref) async {
  final query = ref.watch(cvSearchQueryProvider);
  if (query.trim().length < 2) {
    return const CvSearchResponse(query: '', total: 0, results: []);
  }
  return ref.read(cvthequeRepositoryProvider).searchCVs(query.trim());
});
