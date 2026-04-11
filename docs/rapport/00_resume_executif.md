# Résumé Exécutif — ATS RANDA

## Présentation du projet

ATS RANDA est un système de suivi des candidatures (*Applicant Tracking System*) conçu pour automatiser et optimiser le processus de recrutement grâce à l'intelligence artificielle : depuis le dépôt d'un CV jusqu'à la décision d'entretien, en passant par la recherche sémantique et le scoring multi-critères.

---

## Contexte et problématique

Le recrutement traditionnel souffre de plusieurs inefficacités structurelles :

- **Volume ingérable de CVs** : un poste attractif peut recevoir des centaines de candidatures en quelques jours. Les équipes RH consacrent jusqu'à 80 % de leur temps à la présélection manuelle.
- **Subjectivité** : les critères de sélection varient d'un recruteur à l'autre, générant des incohérences et des biais.
- **Perte d'information** : les CVs papier ou les imports en masse (fichiers Keejob) restent inexploités, faute d'outil d'indexation.
- **Absence de traçabilité** : sans journalisation, il est impossible d'auditer une décision de recrutement ni de mesurer la performance des campagnes.

ATS RANDA répond à ces problèmes en proposant une plateforme centralisée, multilingue (arabe, français, anglais), dotée d'un moteur NLP capable d'analyser automatiquement les CVs, de les comparer sémantiquement aux offres et de produire un classement objectif des candidats.

---

## Objectifs principaux

| Objectif | Description |
|----------|-------------|
| Automatisation du parsing | Extraire automatiquement 15+ champs d'un CV PDF (format Keejob ou générique) via OCR + regex |
| Matching sémantique | Comparer CV et offre par cosinus de similarité sur vecteurs 384-dim (sentence-transformers) |
| Scoring multi-critères | Combiner similarité sémantique (40 %), compétences (35 %), expérience (15 %), langue (10 %) |
| Workflow RH intégré | Prise de décision RETENU / REFUSÉ avec feedback, génération de créneaux d'entretien automatisée |
| Traçabilité complète | Journaux d'audit, timeline candidature 4 étapes, historique des décisions |
| Accessibilité mobile | Application Flutter pour les RH en déplacement, synchronisée en temps réel avec le backend |

---

## Périmètre fonctionnel

Le système expose quatre portails distincts, chacun adapté à un rôle métier précis :

### Rôle VISITEUR (non authentifié)
Consultation des offres publiques, inscription, connexion locale et OAuth2 Google.

### Rôle CANDIDAT
Gestion du profil complet (personnel, professionnel, mobilité), dépôt de CVs (upload PDF ou formulaire structuré), soumission de candidatures, suivi via timeline 4 étapes, générateur de CV PDF, favoris.

### Rôle AGENT de saisie
Import unitaire ou batch de CVs au format Keejob, visualisation de la qualité OCR (score 0–100), gestion de l'historique d'imports, isolation stricte par `agent_id`.

### Rôle RH (Responsable des Ressources Humaines)
CRUD complet des offres d'emploi, déclenchement du matching sémantique, consultation et filtrage des résultats, décisions avec feedback, calendrier des entretiens (manuel et automatisé via n8n), tableaux de bord et statistiques.

### Rôle ADMIN
Gestion des utilisateurs et des rôles, logs d'audit, santé système, statistiques globales, gestion des filiates.

### Application mobile Flutter (RH)
Toutes les fonctionnalités RH accessibles depuis Android/iOS/web : tableau de bord, offres, matching, candidatures, CVthèque, calendrier.

---

## Technologies clés

| Couche | Technologie | Version |
|--------|-------------|---------|
| API backend | FastAPI (Python) | 3.11 |
| Base de données | PostgreSQL + pgvector | 16 |
| Embeddings NLP | sentence-transformers (`paraphrase-multilingual-MiniLM-L12-v2`) | — |
| File d'attente asynchrone | Celery + Redis | 7.2 |
| OCR | Tesseract (fra+eng+ara) | — |
| Frontend web | React 18 + TypeScript + Ant Design 5 | — |
| Routing frontend | React Router 6 + TanStack Query | — |
| Application mobile | Flutter (Dart) + Riverpod + GoRouter | 3.x |
| Infrastructure | Docker Compose (10 services) | — |
| Monitoring | Prometheus + Grafana + Flower | — |
| Automatisation workflows | n8n | latest |
| Proxy HTTP | Nginx | 1.25 |

---

## Chiffres clés du système

| Indicateur | Valeur |
|------------|--------|
| Endpoints API REST | ~65 routes documentées |
| Tables en base de données | 12 tables principales |
| Dimensions des vecteurs embedding | 384 dimensions (pgvector) |
| Champs extraits par le parser Keejob | 15+ entités structurées |
| Critères de scoring | 4 (sémantique, compétences, expérience, langue) |
| Portails web (rôles) | 4 (Candidat, Agent, RH, Admin) |
| Pages web React | ~38 pages |
| Services Docker | 10 services |
| Langues supportées (OCR + NLP) | 3 (français, anglais, arabe) |
| CVs indexés (production) | 4 131 CVs avec embedding |

---

## Valeur ajoutée

1. **Gain de temps RH** : la présélection automatique réduit de plusieurs heures à quelques secondes la revue d'un lot de candidatures.
2. **Objectivité** : le scoring multi-critères avec pondérations configurables (`poids_semantique`, `poids_competences`, etc.) remplace le jugement subjectif.
3. **Multilinguisme natif** : le modèle d'embedding multilingue et l'OCR tri-langue permettent de traiter des CVs en arabe, français et anglais sans prétraitement.
4. **Intégration bout en bout** : de l'import PDF jusqu'à l'envoi d'invitation d'entretien par email, tout le flux est couvert sans outil tiers.
5. **Scalabilité** : l'architecture Celery + Redis permet de traiter des lots de milliers de CVs en arrière-plan sans bloquer l'interface.
6. **Auditabilité** : chaque action est journalisée (`audit_logs`), et chaque décision RH est horodatée et tracée dans `resultats`.
