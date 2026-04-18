# Diagrammes UML — PlantUML pour draw.io

Versions PlantUML de tous les 11 diagrammes UML d'ATS RANDA.
Format compatible **draw.io natif** — résultat entièrement éditable (sélection, déplacement, redimensionnement).

---

## Comment importer dans draw.io

### Méthode 1 — Insert > Advanced > From Text (recommandée)

1. Ouvrir draw.io (app ou https://app.diagrams.net)
2. Menu **Insert** → **Advanced** → **From Text...**
3. Dans la fenêtre qui s'ouvre, sélectionner l'onglet **PlantUML**
4. Copier-coller le contenu d'un fichier `.puml`
5. Cliquer **OK** → le diagramme est inséré comme éléments draw.io natifs

### Méthode 2 — Extra > Edit Diagram

1. Créer un nouveau diagramme vide
2. Menu **Extra** → **Edit Diagram...**
3. Effacer le contenu XML existant
4. Coller le code PlantUML (draw.io détecte automatiquement le format)
5. Cliquer **OK**

---

## Une fois inséré : modifier dans draw.io

Après l'import PlantUML, chaque élément devient un objet draw.io natif :

| Action | Comment |
|--------|---------|
| Sélectionner un élément | Clic simple |
| Déplacer | Clic-glisser |
| Redimensionner | Poignées de coin |
| Modifier le texte | Double-clic |
| Changer la couleur | Panel droit → Fill / Stroke |
| Ajouter une flèche | Survol d'un élément → point vert → glisser |
| Supprimer | Touche Delete |
| Grouper des éléments | Ctrl+G |
| Aligner | Panel Format → Arrange → Align |
| Exporter PNG/SVG/PDF | File → Export As |

---

## Index des fichiers

| Fichier | Type UML | Description |
|---------|----------|-------------|
| `01_classes.puml` | Classes | 12 tables, pgvector, JSONB, énumérations |
| `02_cas_utilisation.puml` | Cas d'utilisation | 5 acteurs, 30+ cas d'utilisation, RBAC |
| `03_sequence_authentification.puml` | Séquence | JWT local, OAuth2 Google, validation token |
| `04_sequence_matching.puml` | Séquence | Import Keejob, Celery NLP, matching pgvector |
| `05_sequence_candidature.puml` | Séquence | Candidature → timeline → entretien n8n |
| `06_composants.puml` | Composants | 11 services Docker, flux réseau |
| `07_etats.puml` | États | CV, candidature, offre, entretien, session |
| `08_activites.puml` | Activités | Processus recrutement bout en bout (swimlanes) |
| `09_deploiement.puml` | Déploiement | Infrastructure Docker Compose, services externes |
| `10_sequence_mobile.puml` | Séquence | App Flutter : démarrage, Riverpod, matching |
| `11_packages.puml` | Packages | Backend Python, Frontend React, Mobile Flutter |

---

## Plugins draw.io activés (vérification)

Dans draw.io desktop : **Help → Manage Plugins** ou **Extras → Edit Diagram**

Pour que PlantUML fonctionne côté serveur (app.diagrams.net), aucun plugin n'est nécessaire — le rendu PlantUML est intégré.

Pour la version offline/desktop, activer le plugin **"PlantUML"** si le bouton n'apparaît pas dans Insert > Advanced.

---

## Astuce : Réorganiser après import

draw.io place les éléments selon le layout PlantUML (top-down ou left-right).
Après import, utiliser **Edit → Select All** puis le bouton **Arrange → Layout** pour réorganiser
automatiquement (options : Tree, Circle, Organic, Grid...).

Pour les diagrammes de séquence (`03`, `04`, `05`, `10`) : les éléments sont linéaires et
généralement bien positionnés. Il suffit d'ajuster les largeurs de colonne.
