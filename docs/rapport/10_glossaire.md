# Glossaire Technique

Ce glossaire définit en français les termes techniques utilisés dans la documentation d'ATS RANDA.

---

**Alembic**
Outil de migration de schéma de base de données pour SQLAlchemy. Il génère des scripts de migration versionnés permettant d'appliquer ou d'annuler des modifications du schéma (ajout de colonnes, création de tables) de façon contrôlée et traçable. Dans ATS RANDA, les modifications à faible risque (ajout de colonnes nullables) sont parfois effectuées directement via `psql` sans passer par Alembic.

---

**AsyncSession**
Session SQLAlchemy en mode asynchrone (`async/await`). Permet d'exécuter des requêtes SQL sans bloquer la boucle asyncio de FastAPI. Toutes les interactions avec la base de données dans ATS RANDA utilisent des `AsyncSession`.

---

**ATS** (*Applicant Tracking System*)
Système de suivi des candidatures. Logiciel permettant aux équipes RH de centraliser, organiser et analyser les candidatures reçues pour un ou plusieurs postes. ATS RANDA est un exemple d'ATS enrichi d'intelligence artificielle.

---

**Celery**
Gestionnaire de files d'attente de tâches asynchrones pour Python. Permet de déléguer des opérations longues ou CPU-intensives (parsing de CV, génération d'embeddings) à des workers séparés qui s'exécutent en arrière-plan, sans bloquer le serveur web principal.

---

**Cosinus (similarité cosinus)**
Mesure de similarité entre deux vecteurs, calculée comme le cosinus de l'angle qui les sépare. Une valeur de 1.0 signifie que les vecteurs pointent dans la même direction (très similaires) ; 0.0 signifie qu'ils sont orthogonaux (non liés) ; -1.0 qu'ils sont opposés. Dans ATS RANDA, la similarité cosinus entre les vecteurs d'un CV et d'une offre d'emploi mesure leur proximité sémantique.

---

**Docker Compose**
Outil Docker permettant de définir et d'orchestrer plusieurs containers applicatifs via un fichier YAML (`docker-compose.yml`). Chaque service (backend, base de données, Redis, etc.) est configuré avec son image, ses variables d'environnement, ses volumes et ses dépendances entre services.

---

**Embedding**
Représentation numérique d'un texte sous forme d'un vecteur de nombres flottants de dimension fixe (384 dans ATS RANDA). Des textes sémantiquement similaires produisent des vecteurs proches dans l'espace vectoriel. Cette représentation permet des comparaisons mathématiques de similarité entre contenus textuels.

---

**FastAPI**
Framework web Python moderne basé sur Starlette et Pydantic. Offre des performances élevées grâce à son support natif de l'asynchronisme (`async/await`), génère automatiquement une documentation OpenAPI (Swagger) à partir des annotations de type, et valide toutes les entrées via Pydantic.

---

**Flower**
Interface web de monitoring pour Celery. Accessible sur le port 5555, elle permet de visualiser l'état des workers, d'inspecter les tâches en cours ou terminées, et de suivre les statistiques de traitement.

---

**GoRouter**
Bibliothèque de navigation déclarative pour Flutter. Gère les routes sous forme d'un arbre, les redirections conditionnelles (authentification), les paramètres de chemin, et les routes imbriquées. Utilisé dans l'application mobile RH pour gérer la navigation entre les écrans et les redirections d'authentification.

---

**Grafana**
Plateforme de visualisation de métriques et de tableaux de bord. Se connecte à Prometheus comme source de données et permet de créer des graphiques et des alertes sur les métriques des services (temps de réponse, utilisation CPU, requêtes par seconde).

---

**Index ivfflat**
Index vectoriel de type *Inverted File Flat* utilisé par l'extension pgvector. Partitionne l'espace vectoriel en clusters (paramètre `lists`) pour accélérer la recherche approximative des plus proches voisins. Offre un compromis entre vitesse de recherche et précision des résultats.

---

**JSONB**
Type de données PostgreSQL pour stocker des documents JSON binaires. Contrairement au type `JSON` classique, `JSONB` est stocké dans un format binaire optimisé permettant des requêtes et des indexations sur les champs internes. Dans ATS RANDA, `cv_entities` et `details` utilisent ce type.

---

**JWT** (*JSON Web Token*)
Standard ouvert (RFC 7519) pour la transmission sécurisée d'informations entre parties sous forme de tokens JSON signés. Structuré en trois parties : en-tête (algorithme), charge utile (claims : email, rôle, expiration) et signature. Dans ATS RANDA, les tokens JWT sont signés avec HS256 et ont une durée de vie de 60 minutes.

---

**Jaccard (similarité de Jaccard)**
Mesure de similarité entre deux ensembles, calculée comme le rapport entre la taille de leur intersection et la taille de leur union : `|A ∩ B| / |A ∪ B|`. Dans ATS RANDA, elle mesure le recouvrement entre les compétences d'un CV et les compétences requises par une offre.

---

**Multilingue**
Capacité à traiter du texte dans plusieurs langues sans prétraitement spécifique par langue. Le modèle `paraphrase-multilingual-MiniLM-L12-v2` est entraîné sur 50+ langues, permettant de comparer directement un CV en arabe avec une offre en français.

---

**n8n**
Outil d'automatisation de workflows no-code/low-code. Permet de créer des pipelines visuels connectant différents services (APIs, bases de données, emails). Dans ATS RANDA, n8n orchestre les workflows d'entretien (génération de créneaux, envoi d'invitations) en s'appuyant entièrement sur les routes backend.

---

**Nginx**
Serveur web et reverse proxy hautes performances. Dans ATS RANDA, Nginx sert de point d'entrée unique (port 80) et route les requêtes vers le backend FastAPI (`/api/*`) ou le serveur de développement frontend (`/`).

---

**NLP** (*Natural Language Processing* / Traitement du Langage Naturel)
Branche de l'intelligence artificielle traitant les interactions entre les ordinateurs et le langage humain. Dans ATS RANDA, le NLP inclut : l'extraction d'entités des CVs (parsing), la détection de langue, la génération d'embeddings sémantiques et le scoring de correspondance.

---

**OAuth2**
Framework d'autorisation permettant à une application tierce d'accéder à des ressources au nom d'un utilisateur, sans partager ses identifiants. Dans ATS RANDA, le flux Authorization Code d'OAuth2 permet aux utilisateurs de se connecter avec leur compte Google.

---

**OCR** (*Optical Character Recognition* / Reconnaissance Optique de Caractères)
Technologie convertissant des images ou des PDFs scannés en texte exploitable par ordinateur. Dans ATS RANDA, Tesseract OCR traite les CVs en format image ou PDF scanné, supportant le français, l'anglais et l'arabe (`fra+eng+ara`).

---

**Parser / Parsing**
Processus d'analyse d'un texte brut pour en extraire des informations structurées. Le parser Keejob (`keejob_parser.py`) analyse le texte d'un CV Keejob et extrait 15+ entités (nom, compétences, expériences, formations, etc.) via des expressions régulières.

---

**pgvector**
Extension PostgreSQL open-source ajoutant un type de données vectoriel (`vector(n)`) et des opérateurs de similarité (cosinus, L2, produit scalaire). Permet de stocker et d'interroger des embeddings directement dans PostgreSQL, évitant le recours à une base de données vectorielle externe.

---

**Prometheus**
Système de surveillance et d'alerte open-source. Collecte des métriques depuis les services (scraping HTTP) à intervalles réguliers et les stocke dans une base de données temporelle. Alimenté par des exporteurs dédiés pour Redis (`redis-exporter`) et PostgreSQL (`postgres-exporter`).

---

**RBAC** (*Role-Based Access Control* / Contrôle d'Accès Basé sur les Rôles)
Modèle de sécurité qui attribue des permissions aux rôles plutôt qu'aux utilisateurs individuels. Chaque utilisateur possède un rôle qui détermine les ressources auxquelles il peut accéder et les actions qu'il peut effectuer. Dans ATS RANDA : VISITOR, CANDIDATE, AGENT, RH, ADMIN.

---

**Reverse Proxy**
Serveur intermédiaire qui reçoit les requêtes des clients et les transmet aux serveurs internes appropriés. Dans ATS RANDA, Nginx joue ce rôle : il reçoit toutes les requêtes sur le port 80 et les redirige vers le backend FastAPI ou le serveur de développement frontend.

---

**Riverpod**
Bibliothèque de gestion d'état pour Flutter, successeur de Provider. Basée sur des providers déclaratifs et immuables (`FutureProvider`, `AsyncNotifierProvider`, `StateProvider`), elle garantit la testabilité, évite les fuites mémoire via `autoDispose`, et permet une composition fine des dépendances.

---

**sentence-transformers**
Bibliothèque Python (basée sur Hugging Face Transformers) permettant de générer des embeddings de haute qualité pour des phrases et paragraphes. Le modèle `paraphrase-multilingual-MiniLM-L12-v2` produit des vecteurs 384-dim normalisés adaptés à la recherche sémantique multilingue.

---

**TanStack Query** (anciennement React Query)
Bibliothèque de gestion du state serveur pour React. Automatise le cache, la revalidation, les états de chargement/erreur et le refetching des données asynchrones. Utilisé dans ATS RANDA pour toutes les requêtes API du frontend.

---

**Zustand**
Bibliothèque de state management légère pour React. Utilise des stores minimalistes basés sur des fonctions. Dans ATS RANDA, Zustand gère l'état global d'authentification (token JWT + utilisateur courant) avec persistance en `localStorage`.
