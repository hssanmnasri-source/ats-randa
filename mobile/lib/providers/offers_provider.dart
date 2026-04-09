import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/job_offer.dart';
import '../repositories/offers_repository.dart';

final offersRepositoryProvider = Provider<OffersRepository>(
  (ref) => OffersRepository(),
);

final offersStatusFilterProvider = StateProvider<String?>((ref) => null);

final offersProvider = FutureProvider.autoDispose<JobOfferListResponse>((ref) async {
  final statut = ref.watch(offersStatusFilterProvider);
  return ref.read(offersRepositoryProvider).getOffers(statut: statut);
});

final offerDetailProvider = FutureProvider.autoDispose.family<JobOffer, int>(
  (ref, id) async {
    return ref.read(offersRepositoryProvider).getOffer(id);
  },
);
