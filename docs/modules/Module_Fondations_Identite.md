---
type: module-dev
titre: "Module 1 — Fondations & Identité"
tags: [cee, plateforme, module, fondations, identite, auth, infra]
proprietaire: À désigner (candidat naturel : Lead Dev, vu le rôle d'intégration transverse)
statut: prêt à démarrer
date: 2026-10-06
sources:
  - "[[Plateforme_CEE_Fusion]]"
  - "[[Authentification-CEE]]"
  - "[[Reunion_Design_System_2026-10-03]]"
---

# 🏗️ Module 1 — Fondations & Identité

> [!info] Rôle de ce module dans la répartition
> C'est le **socle** sur lequel les 4 autres modules s'appuient : session utilisateur, rôles, layout commun, upload, infra. Il n'a **aucune dépendance entrante** vers les autres modules — il peut démarrer immédiatement. Les autres modules en dépendent, mais via un **contrat documenté** (voir §2) qu'ils peuvent mocker pour ne pas attendre que ce module soit terminé.

---

## 1. 🎯 Périmètre du module

### Ce qui est dans ce module
- Intégration du moteur d'authentification partagé (Keycloak, via OIDC/Google OAuth2) — connexion, déconnexion, réception et validation du token
- Profil local synchronisé (table `users`) — identité + rôles, indépendante du moteur d'auth
- Modèle de rôles et middleware d'autorisation réutilisable par tous les modules
- Journal d'audit transverse (table + fonction utilitaire)
- Layout applicatif commun : header/footer, bifurcation du menu par rôle, **barre de navigation Polyspace**, mode sombre
- PWA (manifest, service worker, installabilité)
- Intégration du design system existant (tokens, composants de base)
- Utilitaire d'upload partagé (validation, stockage Cloudflare R2)
- Infrastructure : CI/CD, hébergement, base de données, sauvegardes, domaine

### Ce qui n'est PAS dans ce module
- Le contenu métier de chaque brique (annonces, posts, chatbot...) — ça vit dans les modules 2 à 5
- Les écrans de gestion opérationnelle de la liste blanche (import Excel, ajout responsable de classe) — ils vivent dans le **Module 5 (Administration & Comptes)**, qui écrit dans le schéma défini ici
- Tout ce qui touche à la Brique 2 (dépenses) — **hors périmètre de la plateforme**, devient un module de l'application de gestion interne du CEE (voir [[Plateforme_CEE_Fusion]] §3, Brique 2)

---

## 2. 🤝 Contrat d'interface (ce que ce module expose aux autres)

> [!important] Pourquoi ce contrat existe
> Pour que les modules 2 à 5 puissent travailler **sans attendre** que ce module soit terminé, voici l'interface exacte qu'ils doivent coder contre. Tant que ce module n'est pas livré, **chaque équipe mocke cette interface en local** avec un faux utilisateur/rôle, puis bascule sur la vraie implémentation sans rien changer à son propre code.

### `getSession(request)` — à appeler dans chaque route protégée

```ts
type Session = {
  userId: string;        // UUID Keycloak (claim `sub`) — clé pivot, PAS l'email
  email: string;
  nom: string;
  prenom: string;
  departement: string | null;
  classe: string | null;
  promo: string | null;
  roles: Array<"editeur" | "moderateur" | "admin">;
  isResponsableClasse: boolean; // permission spéciale, pas un rôle (voir §4)
} | null; // null = visiteur non connecté
```

### `requireRole(role: "editeur" | "moderateur" | "admin")` — middleware

Rejette la requête (403) si la session n'a pas le rôle demandé. Les modules l'utilisent pour protéger leurs propres routes d'écriture (ex. Module 2 l'utilise pour `POST /annonces`).

### `requireStudentDomain()` — middleware

Rejette (403) toute requête dont l'email de session n'est **pas** `@esp.sn` ou `@gmail.com`. Exigence directe de l'équipe auth dédiée (voir [[Authentification-CEE]]).

### `logAudit(entry)` — fonction utilitaire

```ts
function logAudit(entry: {
  actorId: string | null;       // UUID, peut devenir orphelin après purge Keycloak
  actorNomSnapshot: string;     // nom/prénom au moment de l'action — JAMAIS recalculé depuis users
  action: string;               // ex. "annonce.publiee", "signalement.traite"
  entity: string;                // ex. "annonce", "post"
  entityId: string;
  metadata?: Record<string, unknown>;
}): Promise<void>
```

**Règle impérative** : `actorNomSnapshot` est écrit une fois, au moment de l'action, et ne dépend plus jamais de l'existence du compte `actorId`. C'est ce qui rend le journal d'audit lisible même après une purge Keycloak (voir §5).

### `uploadFile(file, options)` — utilitaire partagé

```ts
function uploadFile(file: File, options: {
  allowedTypes: string[];       // ex. ["application/pdf", "image/*", "video/*"]
  maxSizeBytes: number;         // par type, voir registre §7
}): Promise<{ url: string; key: string; sizeBytes: number }>
```

Gère : validation du type/taille, garde-fous sécurité (anti zip-bomb et vulnérabilités d'upload similaires), upload vers Cloudflare R2. Utilisé par le Module 2 (pièces jointes d'annonces) et le Module 4 (médias de posts).

### `<AppShell role={session?.roles}>` — composant de layout

Wrapper React/Next.js que chaque page des autres modules utilise pour hériter automatiquement : header/footer communs, barre Polyspace, menu bifurqué par rôle, toggle mode sombre, structure mobile-first. Les autres modules n'ont **jamais** à recoder la navigation.

### Schéma DB `core` (propriété de ce module)

| Table | Colonnes clés | Note |
|---|---|---|
| `core.users` | `id` (UUID, = claim `sub`), `email`, `nom`, `prenom`, `departement`, `classe`, `promo`, `roles[]`, `is_responsable_classe`, `created_at`, `updated_at` | Clé primaire = UUID Keycloak, **jamais l'email** |
| `core.audit_log` | `id`, `actor_id` (nullable, FK `ON DELETE SET NULL`, jamais `CASCADE`), `actor_nom_snapshot`, `action`, `entity`, `entity_id`, `metadata` (JSON), `created_at` | Table append-only |
| `core.whitelist_imports` | `id`, `batch_source` (departement/classe), `imported_by`, `status`, `errors` (JSON), `created_at` | Écrite par le Module 5 |

> [!warning] Règle de modélisation obligatoire pour TOUS les modules (voir §5)
> Toute table d'un autre module qui référence `core.users.id` doit le faire en `ON DELETE SET NULL` (ou équivalent), **jamais en `CASCADE`**. C'est une exigence dure de l'équipe auth dédiée, pas une bonne pratique optionnelle.

### Dépendances entrantes de ce module

**Aucune.** C'est la raison pour laquelle il peut démarrer immédiatement.

---

## 3. 🏗️ Stack technique (identique pour tous les modules)

- **Frontend** : Next.js + React, SSR pour le contenu de lecture de base (pas de JS requis pour lire), JS libre pour les interactions
- **Backend** : Next.js API routes (décision tranchée, voir [[Plateforme_CEE_Fusion]] §7) — pas de NestJS, même pour ce module
- **Base de données** : PostgreSQL unique, un schéma par module (`core`, `diffusion`, `chatbot`, `social`, `admin`) — accès via un ORM commun (proposition par défaut : **Prisma**, à valider par le Tech Lead si un autre choix est préférable)
- **Stockage fichiers** : Cloudflare R2 (pièces jointes, médias) — jamais de vidéo stockée nous-mêmes (YouTube pour la Présentation, voir Module 2)
- **Authentification** : déléguée à un moteur externe mutualisé (Keycloak), connexion Google OAuth2 exclusivement — voir §2 pour le contrat de session
- **Hébergement** : VPS mutualisé via Dokploy + Traefik (infra Hints), HTTPS via Let's Encrypt
- **CI/CD** : GitHub Actions → déploiement automatique sur push `main`
- **Design** : design system existant (consommé, pas construit), mobile-first obligatoire, WCAG 2.1 AA, mode sombre (préférence système + toggle), PWA installable dès ce module

---

## 4. 🔐 Modèle de rôles détaillé

| Rôle / permission | Nature | Portée |
|---|---|---|
| **Visiteur** | Par défaut, sans compte | Lecture publique uniquement |
| **Étudiant** | Compte Google reconnu sur liste blanche | Accès au contenu interne de tous les modules |
| **Responsable de classe** | **Permission spéciale attachée au statut Étudiant**, pas un rôle à part | Peut ajouter un étudiant manquant à sa propre classe (écran dans le Module 5), aucun droit sur les adresses, action tracée |
| **Éditeur** | Droit d'administration additif | Publication directe (annonces, événements, contenu vitrine) — **sans étape de validation séparée** |
| **Modérateur** | Droit d'administration additif | Modération du réseau social (signalements) |
| **Admin** | Droit d'administration additif | Administration générale, gestion des rôles, imports |

Ces rôles sont **cumulables** avec le statut Étudiant et **gérés localement** (pas dans Keycloak, qui ne connaît que l'identité : nom/prénom/email/statut actif).

---

## 5. ⚠️ Contrainte critique : résilience à la purge Keycloak

> [!danger] Exigence non négociable de l'équipe auth dédiée
> Keycloak supprime **définitivement** un compte après 6 mois d'inactivité, **sans garantie d'événement de synchronisation** vers les bases locales. Source : [[Authentification-CEE]].

Conséquences concrètes pour ce module et pour tous les autres :
1. **Aucune clé étrangère vers `core.users.id` ne doit être en `CASCADE`** — toujours `SET NULL` ou équivalent.
2. **Toute donnée d'intérêt collectif** (posts, annonces, lignes d'audit) doit rester lisible et intacte même si son auteur a disparu — affichage d'un libellé générique (ex. "Compte supprimé") à la place du nom.
3. Le journal d'audit stocke un **instantané textuel du nom de l'acteur** au moment de l'action (`actor_nom_snapshot`), jamais une simple référence recalculée.

Ce module définit le patron ; les modules 2 à 5 l'appliquent chacun à leurs propres données (voir leurs sections "résilience" respectives).

---

## 6. 🧭 Navigation Polyspace

> [!important] Exigence transverse de l'écosystème, pas une option
> Source : [[Reunion_Design_System_2026-10-03]].

- **Barre de navigation verticale rétractable**, logos des applications de l'écosystème CEE, application active en surbrillance — inspirée du lanceur d'applications Google
- **Sur mobile** : un bouton unique ouvre la liste des applications
- **Minimum commun exigé** — pas optionnel pour notre plateforme
- Un header de structure similaire aux autres plateformes est "souhaitable mais pas obligatoire"
- **Point ouvert côté écosystème** : composant partagé entre toutes les équipes, ou recréé par chacune (débat React vs Next.js) — ne pas bloquer le développement du layout en attendant : construire la barre nous-mêmes selon les specs visuelles reçues, en gardant l'implémentation isolée pour pouvoir basculer sur un composant partagé si l'écosystème en fournit un plus tard
- **Action administrative (pas dev)** : quelqu'un doit être désigné pour concevoir le logo de la Plateforme CEE et le transmettre à l'équipe Design System — à relayer au Lead Dev si pas encore fait

---

## 7. 📋 Points ouverts assignés à ce module

> [!info] Registre complet : [[Plateforme_CEE_Fusion]] §12
> Ce qui suit est la part de ce module dans le registre global. Les réponses à obtenir viennent de personnes hors de l'équipe dev (Président CEE, équipe auth, équipe Design System) — ce module peut avancer sur l'implémentation en parallèle, avec les valeurs par défaut indiquées, et ajuster quand la réponse arrive.

- [ ] **Format exact des claims du token OIDC** au-delà de `sub`/email, et endpoints admin exacts pour la synchronisation — en attendant, baser l'implémentation sur ce que documente [[Authentification-CEE]]
- [ ] **Vérifier si `@esp.sn` correspond à des comptes Google Workspace** — simplifierait le filtrage de domaine si confirmé, mais l'implémentation actuelle (liste blanche + filtrage applicatif) fonctionne sans cette confirmation
- [ ] **Sauvegardes PostgreSQL** : aucune prévue à ce stade — à spécifier et implémenter dans ce module (mécanisme automatique, stockage sur un autre serveur, restauration testée) avant toute mise en production
- [ ] **Cloisonnement VPS** (Docker/Dokploy vs plusieurs serveurs vs VPS séparé) — décision à suivre avec les porteurs des autres projets sur l'infra Hints, impacte le déploiement de ce module
- [ ] **Qui renouvelle le domaine `cee.domaine.com`** (valide jusqu'en 2027) et comment — à clarifier, sinon prévoir une alerte de rappel dans le monitoring de ce module
- [ ] **Composant Polyspace partagé ou recréé** — voir §6, ne bloque pas le développement
- [ ] **Taille max par fichier et par type** pour `uploadFile()` — valeurs par défaut à proposer (ex. 10 Mo image, 50 Mo vidéo, 5 Mo PDF) en attendant une validation formelle
- [ ] **Désigner le responsable du logo** de la Plateforme CEE — action non-dev, à relayer

---

## 8. ✅ Critères d'acceptation (Definition of Done du module)

- [ ] Un visiteur peut se connecter avec Google et devient "étudiant" si son adresse est sur liste blanche, "visiteur" sinon
- [ ] Un email hors `@esp.sn`/`@gmail.com` est rejeté en 403
- [ ] `getSession()`, `requireRole()`, `logAudit()`, `uploadFile()` sont documentés, testés, et utilisés avec succès par au moins un autre module en intégration
- [ ] Le layout `<AppShell>` s'affiche correctement sur mobile et desktop, avec mode sombre fonctionnel (préférence système + toggle)
- [ ] La barre Polyspace est présente et fonctionnelle (rétractable desktop, bouton unique mobile)
- [ ] La PWA est installable (manifest + service worker minimal)
- [ ] Aucune contrainte `CASCADE` sur une clé étrangère vers `core.users.id`
- [ ] Un test simule la purge d'un utilisateur (suppression de `core.users`) et vérifie qu'aucune autre table ne casse
- [ ] CI/CD fonctionnel : push sur `main` déploie automatiquement sur staging
- [ ] Sauvegardes PostgreSQL automatiques en place, restauration testée au moins une fois

---

## 9. 🛠️ Règles d'ingénierie (checklist obligatoire)

> [!important] Stack = Next.js web (SSR + client) installable en PWA
> Base de référence : colonne **Web monopage**, avec les nuances **Mobile** pertinentes pour la PWA (notamment la règle 11, offline). Les règles 17 et 18 (natif/desktop) sont sans objet pour ce module comme pour les 4 autres — elles ne sont **pas répétées** dans les modules suivants.

| N° | Règle | Application dans ce module |
|---|---|---|
| 1 | 4 états | Écrans de ce module concernés : liste des imports, journal d'audit (si exposé ici en lecture) — chargement/vide/erreur/succès systématiques |
| 2 | try/catch/finally | Sur l'échange avec le moteur d'auth (décodage token, appel API admin Keycloak), erreurs mappées avant tout log ou affichage |
| 3 | Retry backoff | Sur les appels sortants vers le moteur d'auth (1s/3s/6s), **jamais sur un 403** (domaine refusé = définitif, pas transitoire) |
| 4 | Cache TTL | Session utilisateur mise en cache côté serveur (60 s) pour éviter de revalider le token à chaque requête |
| 5 | Pas de travail bloquant | `uploadFile()` (validation + envoi R2) jamais sur le thread de rendu — route API asynchrone dédiée |
| 6 | Pagination et mémoïsation | S'applique aux modules consommateurs de ce contrat (ex. journal d'audit, Module 5) — ce module fournit la primitive, pas de liste longue lui-même |
| 7 | Isolation | **Cœur de ce module** : token de session en cookie `httpOnly`, jamais exposé en JS client — c'est la fondation de tout le reste |
| 8 | Validation avant réseau | Écran de connexion : aucun appel au moteur d'auth sans vérification locale préalable du formulaire (cas rares, la validation forte étant côté moteur d'auth) |
| 9 | Erreurs mappées | Un refus Keycloak (403, token invalide) devient un message utilisateur clair, jamais une stack brute |
| 10 | Compatibilité | `<AppShell>` testé sur mobile et desktop, barre Polyspace comprise |
| 11 | Outbox offline | **Jamais pour l'authentification** — une tentative de connexion ne doit jamais être mise en file offline et rejouée plus tard |
| 12 | Backup | **En scope ici** (exception à la règle générale) : sauvegardes PostgreSQL automatiques, stockage hors site, restauration testée — portée explicitement par ce module (voir §7) |
| 13 | Checklist de fin de passe | Avant chaque livraison : lint, 4 états couverts sur les écrans de gestion liés, build propre, vérification qu'aucune route n'expose un secret |
| 14 | 300 lignes max | Respecté, en particulier sur le middleware d'autorisation (`requireRole`) qui doit rester simple et lisible |
| 15 | Tests obligatoires | Tests unitaires sur `requireRole`, `logAudit`, `uploadFile` ; test E2E du parcours complet "connexion Google → session active" |
| 16 | Sécurité active | Pas de JWT en `localStorage` (cookie `httpOnly` uniquement), pas de secret en dur (clés R2, config Keycloak en variables d'environnement), CSRF sur les routes de mutation |
| 17 | État global centralisé | Sans objet (web, pas d'app native) |
| 18 | Module natif | Sans objet (web, pas de module natif) |

---

## 🔗 Références

- [[Plateforme_CEE_Fusion]] — document de cadrage complet (§1, §2, §2.2, §6, §7, §9, §12)
- [[Authentification-CEE]] — architecture technique Keycloak
- [[Reunion_Design_System_2026-10-03]] — concept Polyspace
- [[CDC_Design_Plateforme_CEE]] — directives transmises à l'équipe Design System
- Modules consommateurs : [[Module_Diffusion_Vitrine_Evenements]], [[Module_Chatbot_RAG]], [[Module_Reseau_Social]], [[Module_Administration_Comptes]]
