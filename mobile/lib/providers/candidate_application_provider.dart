import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/application.dart';
import '../repositories/candidate_application_repository.dart';

final candidateApplicationRepoProvider =
    Provider<CandidateApplicationRepository>(
  (_) => CandidateApplicationRepository(),
);

final candidateApplicationsProvider =
    FutureProvider.autoDispose<List<Application>>((ref) async {
  return ref.read(candidateApplicationRepoProvider).listApplications();
});

final applicationDetailProvider =
    FutureProvider.autoDispose.family<ApplicationDetail, int>((ref, id) async {
  return ref.read(candidateApplicationRepoProvider).getDetail(id);
});
