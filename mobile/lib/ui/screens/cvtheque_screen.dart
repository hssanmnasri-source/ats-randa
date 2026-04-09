import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/cv_provider.dart';
import '../widgets/cv_card.dart';

class CvthequeScreen extends ConsumerStatefulWidget {
  const CvthequeScreen({super.key});

  @override
  ConsumerState<CvthequeScreen> createState() => _CvthequeScreenState();
}

class _CvthequeScreenState extends ConsumerState<CvthequeScreen> {
  final _ctrl = TextEditingController();

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cvAsync = ref.watch(cvthequeProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('CVtheque')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              controller: _ctrl,
              decoration: InputDecoration(
                hintText: 'Rechercher un profil ou competence...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                suffixIcon: _ctrl.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _ctrl.clear();
                          ref.read(cvSearchQueryProvider.notifier).state = '';
                        },
                      )
                    : null,
              ),
              onChanged: (v) =>
                  ref.read(cvSearchQueryProvider.notifier).state = v,
            ),
          ),
          Expanded(
            child: cvAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) =>
                  Center(child: Text('Erreur : $e')),
              data: (data) {
                final q = ref.watch(cvSearchQueryProvider);
                if (q.trim().length < 2) {
                  return const Center(
                    child: Text(
                      'Saisissez au moins 2 caracteres\npour lancer la recherche semantique',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.grey),
                    ),
                  );
                }
                if (data.results.isEmpty) {
                  return const Center(child: Text('Aucun CV trouve'));
                }
                return ListView.builder(
                  itemCount: data.results.length,
                  itemBuilder: (_, i) => CvCard(
                    cv: data.results[i],
                    onTap: () =>
                        context.push('/cvtheque/${data.results[i].cvId}'),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
