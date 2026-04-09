import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme.dart';
import '../../providers/offers_provider.dart';
import '../../providers/dashboard_provider.dart';

class OfferFormScreen extends ConsumerStatefulWidget {
  final int? offerId;
  const OfferFormScreen({super.key, this.offerId});

  @override
  ConsumerState<OfferFormScreen> createState() => _OfferFormScreenState();
}

class _OfferFormScreenState extends ConsumerState<OfferFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titreCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _expCtrl = TextEditingController(text: '0');
  final _compCtrl = TextEditingController();

  String _langue = 'fr';
  String _statut = 'ACTIVE';
  final List<String> _competences = [];
  bool _loading = false;
  bool _initialized = false;

  @override
  void dispose() {
    _titreCtrl.dispose();
    _descCtrl.dispose();
    _expCtrl.dispose();
    _compCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.offerId != null;

    // Load existing offer data if editing
    if (isEdit && !_initialized) {
      final offerAsync = ref.watch(offerDetailProvider(widget.offerId!));
      offerAsync.whenData((offer) {
        if (!_initialized) {
          _titreCtrl.text = offer.titre;
          _descCtrl.text = offer.description;
          _expCtrl.text = offer.experienceRequise.toInt().toString();
          _langue = offer.langueRequise.isEmpty ? 'fr' : offer.langueRequise;
          _statut = offer.statut;
          _competences
            ..clear()
            ..addAll(offer.competencesRequises);
          _initialized = true;
        }
      });
    } else if (!isEdit) {
      _initialized = true;
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(isEdit ? 'Modifier l\'offre' : 'Nouvelle offre'),
        leading: BackButton(onPressed: () => context.canPop() ? context.pop() : context.go('/offers')),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _titreCtrl,
              decoration: const InputDecoration(labelText: 'Titre *'),
              validator: (v) => v == null || v.isEmpty ? 'Requis' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _descCtrl,
              decoration: const InputDecoration(labelText: 'Description *'),
              maxLines: 4,
              validator: (v) => v == null || v.isEmpty ? 'Requis' : null,
            ),
            const SizedBox(height: 12),

            // Competences tag input
            const Text('Compétences requises',
                style: TextStyle(fontWeight: FontWeight.w500)),
            const SizedBox(height: 6),
            Wrap(
              spacing: 6,
              runSpacing: 4,
              children: [
                ..._competences.map((c) => Chip(
                      label: Text(c),
                      backgroundColor: kGoldLight,
                      onDeleted: () =>
                          setState(() => _competences.remove(c)),
                    )),
                SizedBox(
                  width: 180,
                  child: TextField(
                    controller: _compCtrl,
                    decoration: const InputDecoration(
                      hintText: 'Ajouter…',
                      isDense: true,
                      border: OutlineInputBorder(),
                    ),
                    onSubmitted: (v) {
                      final val = v.trim();
                      if (val.isNotEmpty) {
                        setState(() {
                          _competences.add(val);
                          _compCtrl.clear();
                        });
                      }
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            TextFormField(
              controller: _expCtrl,
              keyboardType: TextInputType.number,
              decoration:
                  const InputDecoration(labelText: 'Expérience requise (ans)'),
            ),
            const SizedBox(height: 12),

            DropdownButtonFormField<String>(
              value: _langue,
              decoration: const InputDecoration(labelText: 'Langue requise'),
              items: const [
                DropdownMenuItem(value: 'fr', child: Text('Français')),
                DropdownMenuItem(value: 'ar', child: Text('Arabe')),
                DropdownMenuItem(value: 'en', child: Text('Anglais')),
              ],
              onChanged: (v) => setState(() => _langue = v ?? 'fr'),
            ),
            const SizedBox(height: 12),

            DropdownButtonFormField<String>(
              value: _statut,
              decoration: const InputDecoration(labelText: 'Statut'),
              items: const [
                DropdownMenuItem(value: 'ACTIVE', child: Text('Active')),
                DropdownMenuItem(
                    value: 'BROUILLON', child: Text('Brouillon')),
                DropdownMenuItem(
                    value: 'ARCHIVED', child: Text('Archivée')),
              ],
              onChanged: (v) => setState(() => _statut = v ?? 'ACTIVE'),
            ),
            const SizedBox(height: 24),

            ElevatedButton(
              onPressed: _loading ? null : _save,
              child: _loading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white),
                    )
                  : Text(isEdit ? 'Enregistrer' : 'Créer l\'offre'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);

    final data = {
      'titre': _titreCtrl.text.trim(),
      'description': _descCtrl.text.trim(),
      'competences_requises': _competences,
      'experience_requise': double.tryParse(_expCtrl.text) ?? 0.0,
      'langue_requise': _langue,
      'statut': _statut,
    };

    try {
      final repo = ref.read(offersRepositoryProvider);
      if (widget.offerId != null) {
        await repo.updateOffer(widget.offerId!, data);
        ref.invalidate(offerDetailProvider(widget.offerId!));
      } else {
        await repo.createOffer(data);
      }
      ref.invalidate(offersProvider);
      ref.invalidate(dashboardStatsProvider);
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text('Erreur : $e'), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }
}
