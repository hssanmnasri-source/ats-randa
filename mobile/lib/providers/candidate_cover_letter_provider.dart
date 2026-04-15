import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/cover_letter.dart';
import '../repositories/candidate_cover_letter_repository.dart';

final coverLetterRepoProvider = Provider<CandidateCoverLetterRepository>(
  (_) => CandidateCoverLetterRepository(),
);

final coverLettersProvider =
    FutureProvider.autoDispose<List<CoverLetter>>((ref) async {
  return ref.read(coverLetterRepoProvider).list();
});
