import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme.dart';
import '../../../models/cover_letter.dart';
import '../../../providers/candidate_cover_letter_provider.dart';

class CandidateCoverLettersScreen extends ConsumerWidget {
  const CandidateCoverLettersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lettersAsync = ref.watch(coverLettersProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Lettres de motivation')),
      floatingActionButton: FloatingActionButton(
        backgroundColor: kPrimary,
        foregroundColor: Colors.white,
        onPressed: () => _showCreateDialog(context, ref),
        child: const Icon(Icons.add),
      ),
      body: lettersAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erreur : $e')),
        data: (letters) => letters.isEmpty
            ? const Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.article_outlined,
                        size: 64, color: Colors.grey),
                    SizedBox(height: 12),
                    Text('Aucune lettre de motivation',
                        style: TextStyle(color: Colors.grey)),
                  ],
                ),
              )
            : RefreshIndicator(
                onRefresh: () async =>
                    ref.invalidate(coverLettersProvider),
                child: ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: letters.length,
                  itemBuilder: (_, i) => _LetterCard(
                    letter: letters[i],
                    onEdit: () =>
                        _showEditDialog(context, ref, letters[i]),
                    onDelete: () =>
                        _delete(context, ref, letters[i].id),
                  ),
                ),
              ),
      ),
    );
  }

  Future<void> _showCreateDialog(BuildContext context, WidgetRef ref) async {
    final titreCtrl = TextEditingController();
    final contenuCtrl = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => _LetterDialog(
          titreCtrl: titreCtrl,
          contenuCtrl: contenuCtrl,
          title: 'Nouvelle lettre'),
    );
    if (confirmed == true &&
        titreCtrl.text.trim().isNotEmpty &&
        contenuCtrl.text.trim().isNotEmpty) {
      try {
        await ref
            .read(coverLetterRepoProvider)
            .create(titreCtrl.text.trim(), contenuCtrl.text.trim());
        ref.invalidate(coverLettersProvider);
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context)
              .showSnackBar(SnackBar(content: Text('Erreur : $e')));
        }
      }
    }
  }

  Future<void> _showEditDialog(
      BuildContext context, WidgetRef ref, CoverLetter letter) async {
    final titreCtrl = TextEditingController(text: letter.titre);
    final contenuCtrl = TextEditingController(text: letter.contenu);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => _LetterDialog(
          titreCtrl: titreCtrl,
          contenuCtrl: contenuCtrl,
          title: 'Modifier la lettre'),
    );
    if (confirmed == true) {
      try {
        await ref.read(coverLetterRepoProvider).update(
            letter.id, titreCtrl.text.trim(), contenuCtrl.text.trim());
        ref.invalidate(coverLettersProvider);
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context)
              .showSnackBar(SnackBar(content: Text('Erreur : $e')));
        }
      }
    }
  }

  Future<void> _delete(
      BuildContext context, WidgetRef ref, int id) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Supprimer ?'),
        content: const Text(
            'Cette lettre de motivation sera supprimée définitivement.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Annuler')),
          ElevatedButton(
              style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red),
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Supprimer')),
        ],
      ),
    );
    if (confirmed == true) {
      try {
        await ref.read(coverLetterRepoProvider).delete(id);
        ref.invalidate(coverLettersProvider);
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context)
              .showSnackBar(SnackBar(content: Text('Erreur : $e')));
        }
      }
    }
  }
}

class _LetterCard extends StatelessWidget {
  final CoverLetter letter;
  final VoidCallback onEdit;
  final VoidCallback onDelete;
  const _LetterCard(
      {required this.letter,
      required this.onEdit,
      required this.onDelete});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        leading: const Icon(Icons.article_outlined, color: kPrimary),
        title: Text(letter.titre,
            style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text(
          letter.contenu.length > 80
              ? '${letter.contenu.substring(0, 80)}…'
              : letter.contenu,
          style: const TextStyle(fontSize: 12),
        ),
        trailing: PopupMenuButton<String>(
          onSelected: (v) =>
              v == 'edit' ? onEdit() : onDelete(),
          itemBuilder: (_) => const [
            PopupMenuItem(value: 'edit', child: Text('Modifier')),
            PopupMenuItem(
                value: 'delete',
                child: Text('Supprimer',
                    style: TextStyle(color: Colors.red))),
          ],
        ),
        isThreeLine: true,
      ),
    );
  }
}

class _LetterDialog extends StatelessWidget {
  final TextEditingController titreCtrl;
  final TextEditingController contenuCtrl;
  final String title;
  const _LetterDialog(
      {required this.titreCtrl,
      required this.contenuCtrl,
      required this.title});

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(title),
      content: SizedBox(
        width: double.maxFinite,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: titreCtrl,
              autofocus: true,
              decoration:
                  const InputDecoration(labelText: 'Titre *'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: contenuCtrl,
              maxLines: 6,
              decoration:
                  const InputDecoration(labelText: 'Contenu *'),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Annuler')),
        ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Enregistrer')),
      ],
    );
  }
}
