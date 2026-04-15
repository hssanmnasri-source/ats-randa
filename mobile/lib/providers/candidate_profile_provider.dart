import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/candidate_profile.dart';
import '../repositories/candidate_profile_repository.dart';

final candidateProfileRepoProvider = Provider<CandidateProfileRepository>(
  (_) => CandidateProfileRepository(),
);

/// Full profile (profile + completion + experiences + skills + langues + formations)
final fullProfileProvider = FutureProvider.autoDispose<FullProfile>((ref) async {
  return ref.read(candidateProfileRepoProvider).getFullProfile();
});

/// Individual profile for editing — StateNotifier allows optimistic update
final candidateProfileProvider =
    AsyncNotifierProvider<CandidateProfileNotifier, CandidateProfile>(
        CandidateProfileNotifier.new);

class CandidateProfileNotifier extends AsyncNotifier<CandidateProfile> {
  @override
  Future<CandidateProfile> build() async {
    return ref.read(candidateProfileRepoProvider).getProfile();
  }

  Future<void> updatePersonal(Map<String, dynamic> data) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(candidateProfileRepoProvider).updatePersonal(data),
    );
  }

  Future<void> updateProfessional(Map<String, dynamic> data) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(candidateProfileRepoProvider).updateProfessional(data),
    );
  }
}

/// Experiences list
final candidateExperiencesProvider =
    FutureProvider.autoDispose<List<CandidateExperience>>((ref) async {
  return ref.read(candidateProfileRepoProvider).getExperiences();
});

/// Skills list
final candidateSkillsProvider =
    FutureProvider.autoDispose<List<CandidateSkill>>((ref) async {
  return ref.read(candidateProfileRepoProvider).getSkills();
});
