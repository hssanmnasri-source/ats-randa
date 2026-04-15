import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme.dart';
import '../../../models/candidate_profile.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/candidate_profile_provider.dart';

class CandidateProfileScreen extends ConsumerStatefulWidget {
  const CandidateProfileScreen({super.key});

  @override
  ConsumerState<CandidateProfileScreen> createState() =>
      _CandidateProfileScreenState();
}

class _CandidateProfileScreenState
    extends ConsumerState<CandidateProfileScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final fullAsync = ref.watch(fullProfileProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mon profil'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () =>
                ref.read(authStateProvider.notifier).logout(),
          ),
        ],
        bottom: TabBar(
          controller: _tabs,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          indicatorColor: kGold,
          tabs: const [
            Tab(text: 'Personnel'),
            Tab(text: 'Compétences'),
            Tab(text: 'Expériences'),
          ],
        ),
      ),
      body: fullAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erreur : $e')),
        data: (fp) => TabBarView(
          controller: _tabs,
          children: [
            _PersonalTab(profile: fp.profile),
            _SkillsTab(skills: fp.skills, langues: fp.langues),
            _ExperiencesTab(experiences: fp.experiences),
          ],
        ),
      ),
    );
  }
}

// ── Personal tab ─────────────────────────────────────────────────────────────

class _PersonalTab extends ConsumerStatefulWidget {
  final CandidateProfile profile;
  const _PersonalTab({required this.profile});

  @override
  ConsumerState<_PersonalTab> createState() => _PersonalTabState();
}

class _PersonalTabState extends ConsumerState<_PersonalTab> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nomCtrl;
  late final TextEditingController _prenomCtrl;
  late final TextEditingController _telCtrl;
  late final TextEditingController _villeCtrl;
  late final TextEditingController _titreCtrl;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final p = widget.profile;
    _nomCtrl = TextEditingController(text: p.nom ?? '');
    _prenomCtrl = TextEditingController(text: p.prenom ?? '');
    _telCtrl = TextEditingController(text: p.telephone ?? '');
    _villeCtrl = TextEditingController(text: p.ville ?? '');
    _titreCtrl = TextEditingController(text: p.titrePoste ?? '');
  }

  @override
  void dispose() {
    for (final c in [_nomCtrl, _prenomCtrl, _telCtrl, _villeCtrl, _titreCtrl]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await ref.read(candidateProfileProvider.notifier).updatePersonal({
        'nom': _nomCtrl.text.trim(),
        'prenom': _prenomCtrl.text.trim(),
        'telephone': _telCtrl.text.trim(),
        'ville': _villeCtrl.text.trim(),
        'titre_poste': _titreCtrl.text.trim(),
      });
      ref.invalidate(fullProfileProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Profil mis à jour')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('Erreur : $e'),
              backgroundColor: Colors.red.shade700),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Form(
        key: _formKey,
        child: Column(
          children: [
            // Avatar initials
            CircleAvatar(
              radius: 36,
              backgroundColor: kPrimary,
              child: Text(
                _initials(),
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(height: 6),
            Text(widget.profile.email ?? '',
                style:
                    const TextStyle(color: Colors.grey, fontSize: 13)),
            const SizedBox(height: 20),

            _Field(controller: _prenomCtrl, label: 'Prénom'),
            _Field(controller: _nomCtrl, label: 'Nom'),
            _Field(
                controller: _telCtrl,
                label: 'Téléphone',
                keyboard: TextInputType.phone),
            _Field(controller: _villeCtrl, label: 'Ville'),
            _Field(controller: _titreCtrl, label: 'Titre / Poste visé'),

            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _saving ? null : _save,
                child: _saving
                    ? const SizedBox(
                        height: 18,
                        width: 18,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white))
                    : const Text('Enregistrer'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _initials() {
    final p = widget.profile;
    final parts = [p.prenom ?? '', p.nom ?? '']
        .where((s) => s.isNotEmpty)
        .map((s) => s[0].toUpperCase());
    return parts.take(2).join();
  }
}

class _Field extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final TextInputType? keyboard;
  const _Field(
      {required this.controller,
      required this.label,
      this.keyboard});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        controller: controller,
        keyboardType: keyboard,
        decoration: InputDecoration(labelText: label),
      ),
    );
  }
}

// ── Skills tab ───────────────────────────────────────────────────────────────

class _SkillsTab extends ConsumerWidget {
  final List<CandidateSkill> skills;
  final List<Map<String, dynamic>> langues;
  const _SkillsTab({required this.skills, required this.langues});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Compétences',
                  style: TextStyle(
                      fontWeight: FontWeight.bold, fontSize: 16)),
              IconButton(
                icon: const Icon(Icons.add_circle_outline, color: kPrimary),
                onPressed: () => _showAddSkill(context, ref),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (skills.isEmpty)
            const Text('Aucune compétence ajoutée',
                style: TextStyle(color: Colors.grey))
          else
            Wrap(
              spacing: 8,
              runSpacing: 6,
              children: skills
                  .map((s) => Chip(
                        label: Text(s.nom),
                        deleteIcon: const Icon(Icons.close, size: 16),
                        onDeleted: () => _deleteSkill(context, ref, s.id),
                        backgroundColor:
                            kGold.withValues(alpha: 0.12),
                      ))
                  .toList(),
            ),
          const SizedBox(height: 24),
          const Text('Langues',
              style: TextStyle(
                  fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 8),
          if (langues.isEmpty)
            const Text('Aucune langue renseignée',
                style: TextStyle(color: Colors.grey))
          else
            ...langues.map((l) => ListTile(
                  dense: true,
                  leading:
                      const Icon(Icons.language, color: kPrimary, size: 18),
                  title: Text(l['langue']?.toString() ?? ''),
                  trailing: l['niveau'] != null
                      ? Text(l['niveau'].toString(),
                          style: const TextStyle(
                              color: Colors.grey, fontSize: 12))
                      : null,
                )),
        ],
      ),
    );
  }

  Future<void> _showAddSkill(BuildContext context, WidgetRef ref) async {
    final ctrl = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Ajouter une compétence'),
        content: TextField(
          controller: ctrl,
          autofocus: true,
          decoration:
              const InputDecoration(hintText: 'Ex: Python, React...'),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Annuler')),
          ElevatedButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Ajouter')),
        ],
      ),
    );
    if (confirmed == true && ctrl.text.trim().isNotEmpty) {
      try {
        await ref
            .read(candidateProfileRepoProvider)
            .addSkill(ctrl.text.trim());
        ref.invalidate(candidateSkillsProvider);
        ref.invalidate(fullProfileProvider);
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Erreur : $e')));
        }
      }
    }
  }

  Future<void> _deleteSkill(
      BuildContext context, WidgetRef ref, int id) async {
    try {
      await ref.read(candidateProfileRepoProvider).deleteSkill(id);
      ref.invalidate(candidateSkillsProvider);
      ref.invalidate(fullProfileProvider);
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Erreur : $e')));
      }
    }
  }
}

// ── Experiences tab ──────────────────────────────────────────────────────────

class _ExperiencesTab extends ConsumerWidget {
  final List<CandidateExperience> experiences;
  const _ExperiencesTab({required this.experiences});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Expériences',
                  style: TextStyle(
                      fontWeight: FontWeight.bold, fontSize: 16)),
              IconButton(
                icon: const Icon(Icons.add_circle_outline, color: kPrimary),
                onPressed: () => _showAddExp(context, ref),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (experiences.isEmpty)
            const Text('Aucune expérience ajoutée',
                style: TextStyle(color: Colors.grey))
          else
            ...experiences.map((e) => _ExpCard(exp: e, ref: ref)),
        ],
      ),
    );
  }

  Future<void> _showAddExp(BuildContext context, WidgetRef ref) async {
    final posteCtrl = TextEditingController();
    final entrepriseCtrl = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Ajouter une expérience'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
                controller: posteCtrl,
                autofocus: true,
                decoration:
                    const InputDecoration(labelText: 'Poste *')),
            const SizedBox(height: 8),
            TextField(
                controller: entrepriseCtrl,
                decoration:
                    const InputDecoration(labelText: 'Entreprise')),
          ],
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Annuler')),
          ElevatedButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Ajouter')),
        ],
      ),
    );
    if (confirmed == true && posteCtrl.text.trim().isNotEmpty) {
      try {
        await ref.read(candidateProfileRepoProvider).addExperience({
          'poste': posteCtrl.text.trim(),
          if (entrepriseCtrl.text.trim().isNotEmpty)
            'entreprise': entrepriseCtrl.text.trim(),
        });
        ref.invalidate(candidateExperiencesProvider);
        ref.invalidate(fullProfileProvider);
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Erreur : $e')));
        }
      }
    }
  }
}

class _ExpCard extends StatelessWidget {
  final CandidateExperience exp;
  final WidgetRef ref;
  const _ExpCard({required this.exp, required this.ref});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        leading: const Icon(Icons.work_outline, color: kPrimary),
        title: Text(exp.poste,
            style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (exp.entreprise != null) Text(exp.entreprise!),
            if (exp.dateDebut != null)
              Text(
                '${exp.dateDebut} → ${exp.isCurrent ? 'Présent' : (exp.dateFin ?? '')}',
                style:
                    const TextStyle(fontSize: 11, color: Colors.grey),
              ),
          ],
        ),
        trailing: IconButton(
          icon: const Icon(Icons.delete_outline, color: Colors.red),
          onPressed: () => _delete(context),
        ),
        isThreeLine: exp.entreprise != null,
      ),
    );
  }

  Future<void> _delete(BuildContext context) async {
    try {
      await ref.read(candidateProfileRepoProvider).deleteExperience(exp.id);
      ref.invalidate(candidateExperiencesProvider);
      ref.invalidate(fullProfileProvider);
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Erreur : $e')));
      }
    }
  }
}
