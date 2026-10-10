---
type: module-dev
titre: "Module 2 — Diffusion, Vitrine & Événements"
tags: [cee, plateforme, module, diffusion, vitrine, evenements]
proprietaire: À désigner
statut: prêt à démarrer (dépendances mockables)
date: 2026-10-06
sources:
  - "[[Plateforme_CEE_Fusion]]"
---

# 📣 Module 2 — Diffusion, Vitrine & Événements

> [!info] Rôle de ce module
> Fusionne la Brique 1 (annonces), la Brique 3 (site vitrine) et les Événements (§5) — décision déjà actée dans le document de fusion (jalon M1 "Diffusion + Vitrine"). C'est la **porte d'entrée publique** de la plateforme : ce que voit un visiteur en premier, et le canal qui débloque la Phase 1 du projet Formations.

> [!note] Stack technique
> Identique pour les 5 modules — Next.js (frontend + API routes), PostgreSQL (schéma `diffusion`), Cloudflare R2 pour les pièces jointes, auth déléguée via le Module 1. Détail complet : [[Module_Fondations_Identite]] §3.

---

## 1. 🎯 Périmètre du module

### Ce qui est dans ce module
- Fil d'annonces (publiques et internes), recherche, étiquettes libres
- Pièces jointes sur les annonces (PDF, images, vidéos)
- Brouillon, épinglage, date d'expiration automatique
- Ciblage d'une annonce par département/classe
- Notifications multicanal (push PWA, aperçu WhatsApp, résumé e-mail)
- Catalogue Formations (liste des formations proposées par les clubs)
- Flux RSS public
- Pages vitrine : accueil, rubrique Présentation (vidéos YouTube), départements académiques, commissions du CEE, Qui sommes-nous, Contact, mentions légales
- Calendrier d'événements, inscriptions (illimitées ou à capacité + liste d'attente)

### Ce qui n'est PAS dans ce module
- L'authentification, les rôles, le layout commun, l'upload — fournis par le **Module 1**
- Le chatbot (même s'il consomme le contenu de ce module en lecture) — **Module 3**
- Le réseau social (fil de posts étudiants, différent du fil d'annonces officielles) — **Module 4**
- Les écrans d'import de la liste blanche — **Module 5**
- Le suivi des dépenses — **hors périmètre plateforme** (application de gestion interne du CEE)

---

## 2. 🤝 Contrat d'interface

### Dépendances entrantes (de ce module vers les autres)

| Dépendance | Fournie par | Comment la mocker en attendant |
|---|---|---|
| `getSession()`, `requireRole("editeur")` | Module 1 | Mock local renvoyant `{ roles: ["editeur"] }` pour développer les écrans de publication sans attendre |
| `uploadFile()` | Module 1 | Mock qui retourne une URL locale factice pendant le dev |
| `<AppShell>` (layout) | Module 1 | Travailler avec un layout minimal temporaire, brancher `<AppShell>` dès qu'il est prêt — aucun changement de logique métier à prévoir |
| `logAudit()` | Module 1 | Mock qui logge en console en attendant |

**Aucune dépendance envers les Modules 3, 4, 5** — ce module est indépendant d'eux.

### Ce que ce module expose aux autres

- **Lecture du contenu publié** (annonces, pages vitrine, événements) : via accès direct au schéma `diffusion` (même base PostgreSQL) ou via un endpoint de lecture simple — nécessaire au **Module 3 (Chatbot)** pour indexer le contenu. Le schéma ci-dessous (§3) fait foi tant qu'aucun endpoint dédié n'est construit.
- **Flux RSS public** (`/rss.xml`) — filtré sur "publié", jamais les annonces internes.

### Schéma DB `diffusion` (propriété de ce module)

| Table | Colonnes clés | Note |
|---|---|---|
| `diffusion.annonces` | `id`, `auteur_id` (FK `core.users.id`, `ON DELETE SET NULL`), `titre`, `corps`, `tags[]`, `visibilite` (publique/interne), `departement_cible`, `classe_cible`, `statut` (brouillon/publié/expiré), `epingle` (bool), `date_expiration`, `created_at` | Jamais de `CASCADE` sur `auteur_id` (voir Module 1 §5) |
| `diffusion.pieces_jointes` | `id`, `annonce_id`, `url` (R2), `type`, `taille_bytes` | |
| `diffusion.pages_vitrine` | `id`, `slug`, `titre`, `contenu` (JSON/rich text), `updated_by` (FK `SET NULL`), `updated_at` | Contenu en base, pas de redéploiement nécessaire pour éditer |
| `diffusion.videos_presentation` | `id`, `url_youtube`, `titre`, `ordre_affichage` | |
| `diffusion.formations` | `id`, `nom_club`, `titre_formation`, `description`, `lien_inscription` | Catalogue Formations |
| `diffusion.evenements` | `id`, `auteur_id` (FK `SET NULL`), `titre`, `description`, `date`, `lieu`, `visibilite`, `capacite` (nullable = illimitée) | |
| `diffusion.inscriptions_evenements` | `id`, `evenement_id`, `etudiant_id` (FK `SET NULL`), `statut` (confirmé/liste d'attente), `created_at` | |

---

## 3. 🧱 Fonctionnalités détaillées

### 3.1 Fil d'annonces

- Liste chronologique, filtrable par étiquette (**tags libres**, pas de taxonomie fermée pour le moment)
- Annonces "publiées" visibles visiteur + étudiant ; "internes" réservées étudiant
- **Rôle Éditeur publie directement, sans étape de validation séparée** — pas de rôle "validateur" distinct (décision actée, voir [[Plateforme_CEE_Fusion]] §3 Brique 1)
- **Ciblage département/classe** : une annonce peut être adressée spécifiquement, à partir du profil local (département/classe fournis par le Module 1)
- **Brouillon, épinglage, expiration automatique** : une annonce d'événement disparaît une fois l'événement passé
- **Catalogue Formations** : fonctionnalité à part entière, condition réelle pour que ce module débloque la Phase 1 de Formations — sans elle, l'affirmation "M1 débloque Formations" serait fausse
- Recherche textuelle simple
- Flux RSS distinct de la table brute — n'expose que le "publié", jamais l'interne

### 3.2 Notifications (3 canaux, les trois à implémenter)

1. **Push PWA** — nécessite que le Module 1 ait livré le service worker
2. **Aperçu de lien WhatsApp** — structurer les métadonnées Open Graph de chaque annonce pour un rendu soigné dans une chaîne WhatsApp officielle
3. **Résumé par e-mail** — digest périodique ou immédiat, à spécifier

### 3.3 Site vitrine

- **Accueil** : identité du CEE, actualités publiques, "prochains événements", liens rapides
- **Présentation** (nouveau, 2026-09-29) : vidéos produites par la Commission Communication, **hébergées sur YouTube** (pas sur notre stockage), intégrées par embed avec **chargement différé** (miniature cliquable, le lecteur ne charge qu'au clic) — impératif pour le score Lighthouse
- **Départements académiques** : 6 fiches fixes — Génie Informatique, Génie Mécanique, Génie Chimique et Biologie Appliquée, Génie Électrique, Génie Civil, Gestion (page **distincte** des commissions)
- **Commissions du CEE** : page de gouvernance, alimentée par l'organigramme officiel du CEE (dépendance externe, voir §6)
- **Qui sommes-nous** : 2 sections — institutionnel/historique (bureau exécutif, missions) + mandat/légal (règlement intérieur)
- **Contact**, **Mentions légales** (contenu à valider en externe, voir §6)
- Contenu **modifiable sans redéploiement** : tout est en base, édité via un écran d'administration que ce module fournit lui-même (pas besoin d'attendre le Module 5)
- Performance traitée comme **contrainte de conception dès le départ** (assets optimisés, lazy loading)

### 3.4 Événements

- **Création et publication directe** par le rôle Éditeur — même modèle que les annonces, pas de validation séparée
- **Visibilité** public ou interne, choisie à la publication
- **Capacité au choix de l'organisateur** : illimitée, ou plafonnée avec liste d'attente
- **Intégration vitrine** : "prochains événements" en accueil puise dans la **même source de données**, filtrée sur "publié"
- **Notifications asynchrones uniquement** (pas de WebSocket/temps réel en v1)
- **Paiements en ligne** : hors scope pour l'instant, sauf moyen de paiement déjà existant côté CEE à intégrer — ne pas développer sans confirmation explicite

---

## 4. 🖥️ Écrans à construire

| Écran | Niveau | Détail |
|---|---|---|
| Fil d'annonces (public + interne) | Visiteur/Étudiant | Liste + recherche + filtres par étiquette |
| Détail d'une annonce | Visiteur/Étudiant | Corps, pièces jointes, étiquettes |
| Accueil | Visiteur | Actualités + prochains événements + accès rapides |
| Présentation | Visiteur | Grille/carrousel vidéos, chargement différé |
| Départements / Commissions / Qui sommes-nous / Contact / Mentions légales | Visiteur | Pages de contenu |
| Calendrier d'événements | Visiteur/Étudiant | Vue liste/calendrier, capacité affichée |
| Détail événement + inscription | Visiteur/Étudiant | Formulaire d'inscription, liste d'attente si plein |
| **Admin — Créer/éditer une annonce** | Éditeur | Brouillon, épinglage, expiration, ciblage, pièces jointes |
| **Admin — Créer/éditer un événement** | Éditeur | Date/lieu, public/interne, capacité |
| **Admin — Gestion contenu vitrine** | Éditeur | Édition des pages statiques, pas de redéploiement |
| **Admin — Gestion vidéos Présentation** | Éditeur | Ajout/retrait de liens YouTube, ordre |
| **Admin — Catalogue Formations** | Éditeur | CRUD des formations par club |

---

## 5. 🔒 Résilience à la purge Keycloak (voir Module 1 §5)

- `annonces.auteur_id` et `evenements.auteur_id` : `ON DELETE SET NULL`, jamais `CASCADE`
- Si l'auteur d'une annonce est purgé, l'annonce reste affichée — l'auteur peut être remplacé par le nom de la commission/structure d'origine si disponible, sinon un libellé générique

---

## 6. 📋 Points ouverts assignés à ce module

> [!info] Registre complet : [[Plateforme_CEE_Fusion]] §12

- [ ] **Organigramme officiel des commissions du CEE** — nécessaire pour peupler la page "Commissions du CEE" ; en attendant, construire l'écran avec un jeu de données factice facilement remplaçable
- [ ] **Validation du circuit de rédaction des mentions légales** (Commission IT seule vs autorité administrative ESP) — ne bloque pas le développement de l'écran, juste son contenu final
- [ ] **Yeekai sait-il lire un flux RSS ?** Si non, retirer la fonctionnalité — implémenter quand même en attendant la réponse (coût faible), prévoir un flag pour le désactiver facilement
- [ ] **Calendrier de production du contenu avec la Commission Communication** (vidéos, infos départements) — sans lui, la Présentation reste vide
- [ ] **Taille max par fichier et par type** pour les pièces jointes — coordonner avec le Module 1 (propriétaire de `uploadFile()`)
- [ ] **Liste des vulnérabilités à couvrir par le scan sécurité upload** — coordonner avec le Module 1

---

## 7. ✅ Critères d'acceptation (Definition of Done du module)

- [ ] Une annonce publiée par un Éditeur est visible en < 2 min, sans étape de validation intermédiaire
- [ ] Un visiteur non connecté voit les annonces publiques, un étudiant voit aussi les internes et celles ciblées sur son département/classe
- [ ] Une annonce d'événement expire automatiquement après la date de l'événement
- [ ] Le contenu de base (liste + détail d'annonce, pages vitrine) est lisible **sans JavaScript** (rendu SSR)
- [ ] Lighthouse > 90 sur la vitrine, vidéos incluses (grâce au chargement différé)
- [ ] Le contenu vitrine est modifiable sans redéploiement
- [ ] Les 3 canaux de notification fonctionnent (push, aperçu WhatsApp, e-mail)
- [ ] Le catalogue Formations est publiable et à jour
- [ ] Un événement purgé de son auteur reste affiché sans erreur

---

## 8. 🛠️ Règles d'ingénierie (checklist obligatoire)

> [!important] Référence complète des 18 règles : [[Module_Fondations_Identite]] §9 (rôles 17/18 sans objet, non répétés ici)

| N° | Règle | Application dans ce module |
|---|---|---|
| 1 | 4 états | Fil d'annonces, calendrier d'événements, pages vitrine : chargement/vide ("aucune annonce")/erreur/succès explicites |
| 2 | try/catch/finally | Sur l'upload de pièces jointes (via `uploadFile()`) et l'envoi des notifications (push/WhatsApp/e-mail), erreurs mappées |
| 3 | Retry backoff | Sur l'envoi des notifications multicanal (1s/3s/6s) — **jamais** si le canal rejette définitivement (ex. adresse e-mail invalide) |
| 4 | Cache TTL | Fil d'annonces publiques et calendrier d'événements cachés 60 s côté client — pas de fetch à chaque interaction |
| 5 | Pas de travail bloquant | Génération de l'aperçu Open Graph pour WhatsApp et indexation RSS en job différé, jamais sur la requête de publication |
| 6 | Pagination et mémoïsation | Fil d'annonces et calendrier paginés côté serveur (jamais tout charger) ; liste de formations mémoïsée côté client |
| 7 | Isolation | Hérité du Module 1 — ce module ne gère pas de token, uniquement `getSession()` |
| 8 | Validation avant réseau | Formulaire de création d'annonce/événement : dates cohérentes, taille de pièce jointe vérifiée côté client avant upload |
| 9 | Erreurs mappées | Échec d'upload, annonce expirée par erreur, événement complet → messages clairs, jamais une erreur SQL brute |
| 10 | Compatibilité | Vitrine testée mobile-first en priorité (c'est la première impression du visiteur) |
| 11 | Outbox offline | La création de brouillon d'annonce peut être mise en file offline (non sensible) ; **la publication finale et l'inscription à un événement ne sont jamais rejouées automatiquement hors ligne** |
| 12 | Backup | Hors scope pour ce module — porté par le Module 1 (§7) |
| 13 | Checklist de fin de passe | Lint, 4 états sur chaque écran listé en §4, Lighthouse > 90 vérifié avant chaque livraison |
| 14 | 300 lignes max | Respecté, en particulier sur les formulaires d'édition (annonce/événement) qui doivent être découpés en sous-composants |
| 15 | Tests obligatoires | Tests unitaires sur la logique d'expiration automatique et de ciblage département/classe ; E2E sur "publier une annonce → elle apparaît sur le fil en < 2 min" |
| 16 | Sécurité active | Aucun secret R2/YouTube en dur dans le code, CSRF sur les routes de publication/édition |
| 17 | État global centralisé | Sans objet |
| 18 | Module natif | Sans objet |

---

## 🔗 Références

- [[Plateforme_CEE_Fusion]] — §3 Brique 1, Brique 3, §5 Événements, §13 (jalon M1 fusionné)
- [[Module_Fondations_Identite]] — contrat de session, rôles, upload, layout
- [[Module_Chatbot_RAG]] — consomme le contenu de ce module en lecture
- [[CDC_Design_Plateforme_CEE]] — inventaire d'écrans détaillé
