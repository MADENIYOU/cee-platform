---
type: module-dev
titre: "Module 4 — Réseau social étudiant"
tags: [cee, plateforme, module, reseau-social]
proprietaire: À désigner
statut: prêt à démarrer
date: 2026-10-06
sources:
  - "[[Plateforme_CEE_Fusion]]"
---

# 👥 Module 4 — Réseau social étudiant

> [!info] Rôle de ce module
> Implémente la Brique 5 (simplifiée suite aux retours officiels) : fil de posts, groupes, messagerie différée, profil étudiant, annuaire, et trois sous-modules autonomes (Social, Sport & Culture, Relations extérieures). **Mentorat et RAESP retirés** (traités par la plateforme du réseau Alumni, hors de ce CDC), **Pédagogie/Xam Xam retirée** (couverte par Hints), **plus de rôle `alumni`** — ce module ne gère aucun compte alumni.

> [!note] Stack technique
> Identique pour les 5 modules — Next.js (frontend + API routes), PostgreSQL (schéma `social`), Cloudflare R2 pour les médias, auth déléguée via le Module 1. Détail complet : [[Module_Fondations_Identite]] §3.

---

## 1. 🎯 Périmètre du module

### Ce qui est dans ce module
- Fil de posts (texte, images, vidéos), commentaires, réactions
- Groupes (créés automatiquement par département/promo/centre d'intérêt)
- Messagerie privée différée (pas de temps réel)
- Profil étudiant (compétences, projets, recherche de stage/alternance)
- Annuaire (recherche par promo, département, compétences)
- Sous-module **Social** : signalements/demandes avec choix de confidentialité par le demandeur
- Sous-module **Sport & Culture** : activités, compétitions, tournois, clubs
- Sous-module **Relations extérieures** : partenaires, offres de stage/emploi
- Lien **placeholder** vers la plateforme du réseau Alumni (pas d'annuaire alumni dupliqué ici)
- File de modération (signalements de contenu) pour le rôle Modérateur

### Ce qui n'est PAS dans ce module
- L'authentification, les rôles, le layout, l'upload — **Module 1**
- Le fil d'annonces officielles (différent du fil de posts étudiants) — **Module 2**
- Le chatbot — **Module 3**
- Tout annuaire alumni, mentorat, ou contenu pédagogique — **hors périmètre**, voir les plateformes dédiées (Réseau Alumni, Hints)

---

## 2. 🤝 Contrat d'interface

### Dépendances entrantes

| Dépendance | Fournie par | Comment la mocker en attendant |
|---|---|---|
| `getSession()` (dont `departement`/`classe` pour les groupes auto) | Module 1 | Mock avec un profil étudiant complet (département, classe, promo) pour tester la création automatique de groupes |
| `requireRole("moderateur")` | Module 1 | Mock local |
| `uploadFile()` (médias des posts) | Module 1 | Mock retournant une URL factice |
| `<AppShell>` | Module 1 | Layout minimal temporaire |
| `logAudit()` | Module 1 | Mock console |

**Aucune dépendance envers les Modules 2, 3, 5.**

### Ce que ce module expose aux autres

- Rien de requis par les autres modules au lancement — c'est un module terminal (feuille) de l'arborescence de dépendances.

### Schéma DB `social` (propriété de ce module)

| Table | Colonnes clés | Note |
|---|---|---|
| `social.posts` | `id`, `auteur_id` (FK `core.users.id`, `ON DELETE SET NULL`), `auteur_nom_snapshot`, `contenu`, `medias[]` (URLs R2), `created_at` | `auteur_nom_snapshot` affiché si `auteur_id` devient null (voir §5) |
| `social.comments` | `id`, `post_id`, `auteur_id` (FK `SET NULL`), `auteur_nom_snapshot`, `contenu`, `created_at` | |
| `social.reactions` | `id`, `post_id`, `user_id` (FK `SET NULL`), `type` | |
| `social.groupes` | `id`, `type` (departement/promo/interet), `nom`, `critere` (JSON) | Peuplé automatiquement |
| `social.group_members` | `groupe_id`, `user_id` (FK `SET NULL`) | |
| `social.messages_threads` | `id`, `participants[]` (UUIDs) | |
| `social.messages` | `id`, `thread_id`, `auteur_id` (FK `SET NULL`), `contenu`, `created_at` | Différé, pas de champ "lu en temps réel" |
| `social.profils_etudiants` | `user_id` (FK `core.users.id`), `competences[]`, `projets`, `recherche_stage_alternance` | Extension du profil de base |
| `social.signalements` | `id`, `demandeur_id` (FK `SET NULL`), `contenu`, `confidentiel` (bool), `statut`, `created_at` | Choix de confidentialité par le demandeur |
| `social.activites_sport_culture` | `id`, `titre`, `description`, `auteur_id` (FK `SET NULL`) | |
| `social.offres_relations_exterieures` | `id`, `titre`, `description`, `partenaire`, `auteur_id` (FK `SET NULL`) | |

---

## 3. 🧱 Fonctionnalités détaillées

### 3.1 Fil, groupes, messagerie, profil, annuaire

- Fil de posts : texte, images, vidéos, commentaires, réactions
- **Groupes créés automatiquement** à partir du profil local (département/promo), **sans saisie manuelle** — exploite directement les champs fournis par le Module 1
- Messagerie **différée, pas de temps réel** — pas d'indicateur "en train d'écrire" ni de présence live à construire
- Profil étudiant éditable : compétences, projets, **recherche de stage/alternance** (articulation avec les offres de la plateforme Alumni **laissée ouverte**, voir §6)
- Annuaire : recherche par promo, département, compétences

### 3.2 Espace Alumni — placeholder uniquement

- **Simple lien/carte "pont"** vers la plateforme du réseau Alumni — **pas d'annuaire, de témoignages ni de parcours professionnels dupliqués** sur notre plateforme. Une plateforme dédiée existe déjà ; dupliquer créerait deux sources d'information qui divergeraient inévitablement.

### 3.3 Social (signalements)

- Formulaire de signalement/demande avec **choix explicite de confidentialité par le demandeur** (public ou confidentiel, au cas par cas) — le mécanisme concret de visibilité (qui voit un signalement confidentiel) reste à spécifier (voir §6)

### 3.4 Sport & Culture / Relations extérieures

- Sous-modules de contenu simple (listes d'activités/offres), **activables indépendamment** via feature flags, cohérent avec le caractère "multi-mandat, progressif" de ce module

### 3.5 Modération

- File de signalements de contenu traitée par le rôle **Modérateur** (approuver/masquer/escalader)
- Pas de rattachement nommé à une commission précise — rôle générique, cohérent avec le modèle plat (§2, Module 1)

---

## 4. 🖥️ Écrans à construire

| Écran | Niveau | Détail |
|---|---|---|
| Fil de posts | Étudiant | Créer/commenter/réagir |
| Groupes | Étudiant | Liste + page de groupe (auto-créés) |
| Messagerie | Étudiant | Liste de conversations + thread |
| Profil étudiant | Étudiant | Édition compétences/projets/recherche stage |
| Annuaire | Étudiant | Recherche par promo/département/compétences |
| Formulaire de signalement | Étudiant | Choix public/confidentiel |
| Sport & Culture | Visiteur/Étudiant | Liste d'activités |
| Relations extérieures | Étudiant | Liste de partenaires/offres |
| Carte "pont" Espace Alumni | Étudiant | Lien externe uniquement |
| **Admin — File de signalements** | Modérateur | Traiter les signalements de contenu |

---

## 5. 🔒 Résilience à la purge Keycloak

> [!important] Spécifiquement concerné
> Ce module est celui où cette contrainte a le plus d'impact visible : des posts publics doivent survivre à la disparition de leur auteur.

- Toute table avec `..._id` référençant `core.users.id` utilise `ON DELETE SET NULL`, **jamais `CASCADE`**
- Les tables `posts`, `comments` stockent un **`auteur_nom_snapshot`** au moment de la création, affiché à la place du nom réel si `auteur_id` devient `null`
- Critère d'acceptation explicite : un post dont l'auteur a été purgé reste visible et intact, sans erreur ni suppression en cascade

---

## 6. 📋 Points ouverts assignés à ce module

> [!info] Registre complet : [[Plateforme_CEE_Fusion]] §12

- [ ] **Mécanisme concret du choix public/confidentiel sur les signalements "Social"** : à qui un signalement confidentiel est-il visible (demandeur + rôle Modérateur uniquement) ? À spécifier avant de construire le formulaire définitif
- [ ] **Articulation du profil "recherche de stage/alternance"** avec les offres déjà publiées par la plateforme Alumni — **laissé ouvert**, construire l'écran de profil sans ce lien pour l'instant, l'ajouter quand la réponse arrive
- [ ] **Critère d'adoption** : nombre d'étudiants actifs mesuré 3 mois après lancement — pas un blocage dev, mais prévoir l'instrumentation (analytics basique) dès la conception

---

## 7. ✅ Critères d'acceptation (Definition of Done du module)

- [ ] Un étudiant connecté peut poster, commenter, réagir
- [ ] Les groupes se créent automatiquement à partir du profil local, sans action manuelle
- [ ] La modération communautaire (signalement) + le rôle Modérateur fonctionnent
- [ ] Les données sont exportables (conformité RGPD/loi n° 2008-12)
- [ ] Chaque sous-module (Social, Sport & Culture, Relations extérieures) est déployable indépendamment via feature flag
- [ ] Un post dont l'auteur a été purgé par Keycloak reste visible et intact
- [ ] Le lien vers la plateforme Alumni fonctionne, sans contenu dupliqué de notre côté
- [ ] L'instrumentation du critère d'adoption (étudiants actifs) est en place

---

## 8. 🛠️ Règles d'ingénierie (checklist obligatoire)

> [!important] Référence complète des 18 règles : [[Module_Fondations_Identite]] §9 (rôles 17/18 sans objet, non répétés ici)

| N° | Règle | Application dans ce module |
|---|---|---|
| 1 | 4 états | Fil de posts, groupes, messagerie, annuaire : chargement/vide ("aucun post pour l'instant")/erreur/succès explicites — **particulièrement important ici** vu le critère d'adoption (§7) : un fil vide doit rester engageant, pas juste un écran cassé |
| 2 | try/catch/finally | Sur l'envoi de message, la publication de post, l'upload de média — erreurs mappées avant affichage |
| 3 | Retry backoff | Sur l'envoi de message en messagerie différée (1s/3s/6s) — cohérent avec le caractère non temps réel du module |
| 4 | Cache TTL | Fil de posts et annuaire cachés 60 s côté client ; les groupes auto-créés ne changent pas souvent, cache plus long envisageable |
| 5 | Pas de travail bloquant | Upload de médias (images/vidéos de post) via `uploadFile()` jamais bloquant l'affichage du fil |
| 6 | Pagination et mémoïsation | **Fil de posts et annuaire = cas d'usage principal de cette règle** dans ce module : pagination serveur obligatoire, jamais charger tous les posts d'un coup |
| 7 | Isolation | Hérité du Module 1 |
| 8 | Validation avant réseau | Formulaire de signalement : contenu obligatoire, choix public/confidentiel explicite avant envoi |
| 9 | Erreurs mappées | Échec d'envoi de message, de création de groupe (nom déjà pris), etc. → messages clairs |
| 10 | Compatibilité | Fil et messagerie testés mobile-first — usage attendu majoritairement mobile |
| 11 | Outbox offline | **Cas d'usage pertinent** : un post ou commentaire rédigé hors ligne peut être mis en file (service worker + IndexedDB) et publié à la reconnexion — **jamais** pour un signalement confidentiel (traçabilité sensible, doit partir avec une connexion active vérifiée) |
| 12 | Backup | Hors scope pour ce module — porté par le Module 1 |
| 13 | Checklist de fin de passe | Vérifier systématiquement : `auteur_nom_snapshot` renseigné à chaque création de post/commentaire, pagination active sur toutes les listes |
| 14 | 300 lignes max | Respecté, en particulier sur les composants de fil (liste + item + actions séparés) |
| 15 | Tests obligatoires | Test explicite de la résilience à la purge : créer un post, supprimer l'utilisateur en base, vérifier que le post reste affiché avec le nom en instantané |
| 16 | Sécurité active | Pas de contenu utilisateur injecté sans échappement (XSS), CSRF sur les routes de création/modération |
| 17 | État global centralisé | Sans objet |
| 18 | Module natif | Sans objet |

---

## 🔗 Références

- [[Plateforme_CEE_Fusion]] — §3 Brique 5
- [[Module_Fondations_Identite]] — contrat de session, résilience à la purge
- [[CDC_Design_Plateforme_CEE]] — inventaire d'écrans (vue Étudiant)
