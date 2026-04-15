import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/public_offer.dart';
import '../repositories/candidate_offer_repository.dart';

final candidateOfferRepoProvider = Provider<CandidateOfferRepository>(
  (_) => CandidateOfferRepository(),
);

/// Search query — watched by the offers list provider
final candidateOfferSearchProvider = StateProvider.autoDispose<String>((_) => '');

final candidateOffersProvider =
    FutureProvider.autoDispose<List<PublicOffer>>((ref) async {
  final search = ref.watch(candidateOfferSearchProvider);
  return ref.read(candidateOfferRepoProvider).listOffers(search: search);
});

final candidateOfferDetailProvider =
    FutureProvider.autoDispose.family<PublicOffer, int>((ref, id) async {
  return ref.read(candidateOfferRepoProvider).getOffer(id);
});
