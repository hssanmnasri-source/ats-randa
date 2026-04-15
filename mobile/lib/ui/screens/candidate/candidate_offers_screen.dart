import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme.dart';
import '../../../models/public_offer.dart';
import '../../../providers/candidate_offer_provider.dart';

class CandidateOffersScreen extends ConsumerStatefulWidget {
  const CandidateOffersScreen({super.key});

  @override
  ConsumerState<CandidateOffersScreen> createState() =>
      _CandidateOffersScreenState();
}

class _CandidateOffersScreenState
    extends ConsumerState<CandidateOffersScreen> {
  final _searchCtrl = TextEditingController();

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final offersAsync = ref.watch(candidateOffersProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Offres d\'emploi')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              controller: _searchCtrl,
              decoration: InputDecoration(
                hintText: 'Rechercher une offre…',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchCtrl.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchCtrl.clear();
                          ref
                              .read(candidateOfferSearchProvider.notifier)
                              .state = '';
                        },
                      )
                    : null,
                filled: true,
                fillColor: Colors.grey.shade100,
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: BorderSide.none),
              ),
              onChanged: (v) =>
                  ref.read(candidateOfferSearchProvider.notifier).state = v,
            ),
          ),
          Expanded(
            child: offersAsync.when(
              loading: () =>
                  const Center(child: CircularProgressIndicator()),
              error: (e, _) =>
                  Center(child: Text('Erreur : $e')),
              data: (offers) => offers.isEmpty
                  ? const Center(
                      child: Text('Aucune offre disponible',
                          style: TextStyle(color: Colors.grey)))
                  : RefreshIndicator(
                      onRefresh: () async =>
                          ref.invalidate(candidateOffersProvider),
                      child: ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        itemCount: offers.length,
                        itemBuilder: (_, i) => _OfferCard(
                          offer: offers[i],
                          onTap: () => context.push(
                              '/candidate/offers/${offers[i].id}'),
                        ),
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

class _OfferCard extends StatelessWidget {
  final PublicOffer offer;
  final VoidCallback onTap;
  const _OfferCard({required this.offer, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(offer.titre,
                        style: const TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 15)),
                  ),
                  if (offer.isNew)
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: kGold.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Text('Nouveau',
                          style: TextStyle(
                              color: kGold,
                              fontSize: 10,
                              fontWeight: FontWeight.bold)),
                    ),
                ],
              ),
              const SizedBox(height: 6),
              if (offer.ville != null)
                Row(
                  children: [
                    const Icon(Icons.location_on_outlined,
                        size: 13, color: Colors.grey),
                    const SizedBox(width: 4),
                    Text(offer.ville!,
                        style: const TextStyle(
                            fontSize: 12, color: Colors.grey)),
                  ],
                ),
              const SizedBox(height: 6),
              Wrap(
                spacing: 6,
                runSpacing: 4,
                children: [
                  _Chip('${offer.experienceRequise.toInt()} ans exp.'),
                  _Chip(offer.langueRequise.toUpperCase()),
                  if (offer.nbCandidatures > 0)
                    _Chip('${offer.nbCandidatures} candidat(s)'),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  final String label;
  const _Chip(this.label);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: kPrimary.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(label,
          style: const TextStyle(fontSize: 11, color: kPrimary)),
    );
  }
}
