import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme.dart';
import '../../providers/offers_provider.dart';
import '../widgets/offer_card.dart';

class OffersScreen extends ConsumerWidget {
  const OffersScreen({super.key});

  static const _filters = [
    (label: 'Toutes', value: null),
    (label: 'Actives', value: 'ACTIVE'),
    (label: 'Archivées', value: 'ARCHIVED'),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedFilter = ref.watch(offersStatusFilterProvider);
    final offersAsync = ref.watch(offersProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Offres d\'emploi')),
      floatingActionButton: FloatingActionButton(
        backgroundColor: kPrimary,
        onPressed: () => context.push('/offers/create'),
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: Column(
        children: [
          // Filter chips
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(
              children: _filters.map((f) {
                final selected = selectedFilter == f.value;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(f.label),
                    selected: selected,
                    selectedColor: kPrimary.withValues(alpha: 0.15),
                    checkmarkColor: kPrimary,
                    onSelected: (_) => ref
                        .read(offersStatusFilterProvider.notifier)
                        .state = f.value,
                  ),
                );
              }).toList(),
            ),
          ),
          Expanded(
            child: offersAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(
                child: Text('Erreur : $e',
                    style: const TextStyle(color: Colors.red)),
              ),
              data: (data) => RefreshIndicator(
                onRefresh: () async => ref.invalidate(offersProvider),
                child: data.offers.isEmpty
                    ? const Center(child: Text('Aucune offre trouvée'))
                    : ListView.builder(
                        itemCount: data.offers.length,
                        itemBuilder: (_, i) => OfferCard(
                          offer: data.offers[i],
                          onTap: () =>
                              context.push('/offers/${data.offers[i].id}'),
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
