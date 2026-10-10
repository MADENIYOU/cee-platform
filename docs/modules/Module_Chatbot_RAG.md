---
type: module-dev
titre: "Module 3 — Chatbot RAG"
tags: [cee, plateforme, module, chatbot, rag]
proprietaire: À désigner
statut: prêt à démarrer (avec données de test en attendant le Module 2)
date: 2026-10-06
sources:
  - "[[Plateforme_CEE_Fusion]]"
---

# 🤖 Module 3 — Chatbot RAG

> [!info] Rôle de ce module
> Implémente la Brique 4 : un assistant conversationnel **RAG (retrieval-augmented generation) scopé aux données de la plateforme** — événements/annonces publiés et informations propres à chaque département/bureau d'inscription. **Ce n'est pas Rita** (Yeeguide/Yeekai) : Rita aide à se situer sur le campus (carte 3D) et intervient sur la marketplace. Cette distinction doit apparaître dans toute présentation publique du chatbot pour éviter qu'un lecteur externe n'y voie un doublon.

> [!note] Stack technique
> Identique pour les 5 modules — Next.js (frontend + API routes), PostgreSQL (schéma `chatbot`), auth déléguée via le Module 1. Détail complet : [[Module_Fondations_Identite]] §3.

---

## 1. 🎯 Périmètre du module

### Ce qui est dans ce module
- Widget conversationnel (texte), ouvert aux visiteurs (avec limite de questions) et aux étudiants (sans limite)
- Index RAG sur le contenu publié (annonces, pages vitrine, événements du Module 2) + FAQ structurée par département/bureau d'inscription
- Réponses **sourcées** (lien vers l'annonce/page d'origine), "je ne sais pas" si rien n'est trouvé
- Escalade par **ticket** (coordonnées du demandeur transmises) en cas de non-réponse
- Filtrage par niveau d'accès (jamais de citation de contenu interne à un visiteur non connecté)
- Synchronisation de l'index avec le cycle de vie du contenu (publication, modification, **expiration**)
- Journal des conversations anonymisé

### Ce qui n'est PAS dans ce module
- Le contenu lui-même (annonces, pages) — produit et géré par le **Module 2**, ce module ne fait que l'indexer en lecture
- L'authentification et la limite de questions par profil — le **comptage** est de notre ressort, mais la **session** (visiteur vs étudiant) vient du Module 1
- La messagerie différée du réseau social — **Module 4**, un chatbot n'est pas une messagerie entre humains

---

## 2. 🤝 Contrat d'interface

### Dépendances entrantes

| Dépendance | Fournie par | Comment la mocker en attendant |
|---|---|---|
| `getSession()` (pour distinguer visiteur/étudiant) | Module 1 | Mock renvoyant alternativement `null` (visiteur) et un utilisateur étudiant pour tester les deux comportements |
| `logAudit()` | Module 1 | Mock console |
| Contenu indexable (`diffusion.annonces`, `diffusion.pages_vitrine`, `diffusion.evenements`) | Module 2 | **Construire un jeu de données de test** respectant le schéma documenté dans [[Module_Diffusion_Vitrine_Evenements]] §2 — brancher sur les vraies tables dès que le Module 2 les expose, sans changer la logique d'indexation |

**Aucune dépendance envers les Modules 4 et 5.**

### Ce que ce module expose aux autres

- Le widget chatbot lui-même (`<ChatbotWidget />`), que les autres modules peuvent intégrer dans leurs propres pages si besoin (ex. une page "Aide" dans le réseau social) — composant autonome, pas de dépendance inverse requise au lancement.

### Schéma DB `chatbot` (propriété de ce module)

| Table | Colonnes clés | Note |
|---|---|---|
| `chatbot.faq_entries` | `id`, `departement_ou_bureau`, `question`, `reponse`, `maintenu_par`, `updated_at` | Alimentée par les structures départementales (voir §6) |
| `chatbot.chat_sessions` | `id`, `user_id` (FK `core.users.id`, `ON DELETE SET NULL`, nullable pour visiteur), `is_visiteur`, `questions_count`, `created_at` | Sert au compteur de limite visiteur |
| `chatbot.chat_messages` | `id`, `session_id`, `role` (user/assistant), `contenu`, `sources` (JSON, liens vers annonces/pages), `created_at` | **Anonymisé** — aucune donnée personnelle au-delà de la session |
| `chatbot.chat_tickets` | `id`, `session_id`, `contact_info`, `question_originale`, `statut`, `created_at` | Créé quand le chatbot répond "je ne sais pas" |

---

## 3. 🧱 Fonctionnalités détaillées

### 3.1 Architecture

- **RAG ancré sur les données de la plateforme** — pas de LLM libre généraliste. Les détails de coût/hébergement restent à préciser par le Président Commission IT (voir §6), mais l'architecture (retrieval + génération contrainte aux documents récupérés) est actée.
- **Base de connaissances sur deux sources complémentaires** :
  1. Contenu déjà publié (annonces, pages départements/Présentation) — indexé tel quel
  2. **FAQ structurée** par département/bureau d'inscription — question/réponse explicites, maintenues par les structures concernées (voir §6)

### 3.2 Comportement

- **Réponses sourcées** : chaque réponse renvoie vers l'annonce ou la page d'origine
- **"Je ne sais pas"** si rien n'est trouvé → ouverture automatique d'un ticket avec les coordonnées du demandeur
- **Index synchronisé** avec les publications, modifications et **expirations** d'annonces (décidées dans le Module 2) — sans ça, le chatbot présenterait comme "à venir" un événement déjà passé
- **Filtrage par niveau d'accès** : la recherche RAG ne doit jamais remonter un contenu interne à une session visiteur — vérifier le champ `visibilite` de chaque document indexé avant de l'inclure dans une réponse
- **Limite de questions pour les visiteurs non connectés** (seuil exact à chiffrer, voir §6), illimité pour les étudiants

### 3.3 Journal & confidentialité

- Journal des conversations **anonymisé** — aucun identifiant réel au-delà de l'UUID de session
- Durée de conservation alignée sur la loi sénégalaise n° 2008-12 (CDP), pas une durée arbitraire — à préciser (voir §6)
- **Aucune donnée personnelle transmise au service qui héberge le RAG** (exigence RGPD/légalité, voir [[Plateforme_CEE_Fusion]] §8)

---

## 4. 🖥️ Écrans à construire

| Écran | Niveau | Détail |
|---|---|---|
| Widget chatbot | Visiteur (limité) / Étudiant | Bulles de message, citation de source, état "je ne sais pas" + formulaire de contact, compteur de questions restantes pour visiteur |
| **Admin — Gestion FAQ structurée** | Éditeur ou rôle dédié à confirmer | CRUD des entrées FAQ par département/bureau |
| **Admin — File des tickets d'escalade** | Admin/Modérateur à confirmer | Liste des tickets ouverts, suivi de traitement |

---

## 5. 🔒 Résilience à la purge Keycloak

- `chat_sessions.user_id` : `ON DELETE SET NULL`, jamais `CASCADE` — l'historique de conversation reste exploitable pour l'amélioration continue même si le compte associé disparaît
- Les messages eux-mêmes ne contiennent déjà aucune donnée personnelle directe (anonymisation dès la conception), donc l'impact d'une purge est minimal par construction

---

## 6. 📋 Points ouverts assignés à ce module

> [!info] Registre complet : [[Plateforme_CEE_Fusion]] §12 — plusieurs de ces points conditionnent fortement l'architecture technique, à remonter en priorité au Président Commission IT

- [ ] **Compatibilité budget 0 FCFA** : coût d'hébergement du RAG (API tierce ou auto-hébergé) — bloquant pour le choix d'implémentation concret, démarrer avec une solution auto-hébergée légère par défaut si pas de réponse rapide
- [ ] **Mesure du "score de confiance"** déclenchant l'escalade — dépend du choix d'implémentation ci-dessus, proposer un seuil de similarité de recherche par défaut en attendant
- [ ] **Qui rédige et maintient la FAQ structurée** par département/bureau d'inscription — sans réponse, construire l'écran de gestion (§4) et attendre que le contenu soit alimenté
- [ ] **Limite exacte du nombre de questions** pour les visiteurs non connectés — proposer une valeur par défaut raisonnable (ex. 10/jour) en attendant arbitrage
- [ ] **Liste de référence des questions fréquentes** pour mesurer le critère d'acceptation "80%" — à construire par la Commission Communication (voir [[Plateforme_CEE_Fusion]] §3 Brique 4)
- [ ] **Durée de conservation du journal du chatbot** — à aligner sur la loi n° 2008-12 une fois précisée

---

## 7. ✅ Critères d'acceptation (Definition of Done du module)

- [ ] 80% des questions de la liste de référence (fournie par la Com Comm) sont résolues sans escalade
- [ ] Chaque réponse normale cite sa source (lien vers l'annonce/page d'origine)
- [ ] Aucune hallucination sur les procédures officielles (garanti par le "je ne sais pas" + sourcing, pas par une promesse de qualité du modèle)
- [ ] Réponse en moins de 3 secondes
- [ ] Un visiteur non connecté ne reçoit jamais de contenu interne dans une réponse
- [ ] Le compteur de questions visiteur fonctionne et bloque au-delà du seuil
- [ ] L'index reflète une expiration d'annonce dans un délai raisonnable (pas de faux "à venir")
- [ ] Le journal de conversation est vérifiablement anonymisé (revue manuelle)

---

## 8. 🛠️ Règles d'ingénierie (checklist obligatoire)

> [!important] Référence complète des 18 règles : [[Module_Fondations_Identite]] §9 (rôles 17/18 sans objet, non répétés ici)

| N° | Règle | Application dans ce module |
|---|---|---|
| 1 | 4 états | Widget chatbot : en attente de réponse / vide (première ouverture) / erreur (RAG indisponible) / réponse affichée |
| 2 | try/catch/finally | **Critique ici** : tout appel au moteur RAG (recherche + génération) entouré d'un try/catch, avec repli explicite sur "je ne sais pas" + ticket en cas d'échec technique |
| 3 | Retry backoff | Sur l'appel au service d'hébergement du RAG (1s/3s/6s) ; au-delà, basculer directement sur l'ouverture d'un ticket plutôt que de faire attendre l'utilisateur indéfiniment |
| 4 | Cache TTL | L'index RAG n'est **pas** un cache classique à TTL fixe — il doit se resynchroniser sur chaque publication/modification/expiration de contenu (Module 2), pas sur un minuteur simple |
| 5 | Pas de travail bloquant | L'indexation du contenu (ré-embedding après une publication) s'exécute en job différé, jamais en bloquant la réponse au visiteur en cours de conversation |
| 6 | Pagination et mémoïsation | Historique de conversation paginé si long ; liste des tickets (écran admin) paginée côté serveur |
| 7 | Isolation | Hérité du Module 1 — ce module ne stocke aucune donnée personnelle au-delà de l'UUID de session anonymisé |
| 8 | Validation avant réseau | Le formulaire de ticket (coordonnées du demandeur) est validé côté client avant envoi |
| 9 | Erreurs mappées | Une erreur du service RAG ne doit **jamais** apparaître comme une "hallucination" aux yeux de l'utilisateur — toujours distinguer explicitement "je ne sais pas" (réponse honnête) d'une erreur technique (repli propre) |
| 10 | Compatibilité | Widget testé mobile-first — c'est l'usage principal attendu |
| 11 | Outbox offline | Hors de propos pour une conversation (nécessite une connexion active) — pas d'outbox à prévoir pour les messages du chat |
| 12 | Backup | Hors scope pour ce module — porté par le Module 1 |
| 13 | Checklist de fin de passe | Vérifier systématiquement : sourcing présent sur toute réponse normale, filtrage par niveau d'accès actif, compteur visiteur fonctionnel |
| 14 | 300 lignes max | Respecté, en particulier sur la logique de filtrage par niveau d'accès (à isoler dans son propre module de code) |
| 15 | Tests obligatoires | Test explicite : une session visiteur ne doit **jamais** recevoir un contenu interne dans une réponse — test automatisé non négociable sur ce point précis |
| 16 | Sécurité active | Aucune donnée personnelle transmise au service d'hébergement du RAG (voir §3.3) — à vérifier par un test, pas seulement une promesse |
| 17 | État global centralisé | Sans objet |
| 18 | Module natif | Sans objet |

---

## 🔗 Références

- [[Plateforme_CEE_Fusion]] — §3 Brique 4
- [[Module_Fondations_Identite]] — contrat de session
- [[Module_Diffusion_Vitrine_Evenements]] — contenu source à indexer
- [[CDC_Design_Plateforme_CEE]] — composant widget chatbot
