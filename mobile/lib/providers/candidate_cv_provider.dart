import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/candidate_cv.dart';
import '../repositories/candidate_cv_repository.dart';

final candidateCvRepoProvider = Provider<CandidateCvRepository>(
  (_) => CandidateCvRepository(),
);

final candidateCvsProvider =
    FutureProvider.autoDispose<List<CandidateCV>>((ref) async {
  return ref.read(candidateCvRepoProvider).listCvs();
});

final candidateCvDetailProvider =
    FutureProvider.autoDispose.family<CandidateCV, int>((ref, id) async {
  return ref.read(candidateCvRepoProvider).getCv(id);
});
