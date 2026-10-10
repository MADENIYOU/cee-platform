# Handoff — Plateforme CEE

Document de passation couvrant l'intégralité de la session de cadrage et de développement, du premier cahier des charges aux Modules 1 et 5 fonctionnels et mergés dans `main`. Destiné à toute personne qui reprend ce travail (équipe, nouveau Lead Dev, board de la Commission IT).

---

## 1. Contexte et objectif de la session

Le projet "Plateforme CEE" partait de deux documents séparés et partiellement contradictoires : un CDC officiel (`CDC_Plateforme_CEE.md`) et une proposition informelle "Amicale" (`Projet_plateforme_amicale.pdf`) — confirmé en cours de session que l'Amicale et le CEE désignent la même structure. L'objectif de la session a été de :

1. Fusionner les deux documents en un cadrage unique et cohérent
2. Intégrer des retours officiels ultérieurs qui ont fait évoluer le périmètre en profondeur
3. Découper le travail en modules indépendants pour une équipe de 5 développeurs
4. Mettre en place l'infrastructure GitHub
5. Implémenter et vérifier réellement le premier module (Fondations & Identité)

Tous les documents de cadrage produits vivent dans le vault Obsidian `/Users/xpertech/Docs/MNAS/cee-platform/`. Ce fichier résume le travail ; il ne remplace pas ces documents sources, auxquels il renvoie.

---

## 2. Cadrage produit

### 2.1 Document de fusion

`Plateforme_CEE_Fusion.md` est le document de référence produit. Il fusionne le CDC officiel et la proposition Amicale, avec pour chaque décision un bloc "Pourquoi" expliquant le raisonnement. Structure finale : 14 sections numérotées + références, avec un **registre des points ouverts (§12)** consolidant tous les `[!todo]` du document, groupés par qui doit trancher.

### 2.2 Pivot majeur suite aux retours officiels (2026-09-27 à 2026-10-06)

Trois documents reçus en cours de session ont changé le périmètre de façon significative :

- **`Retours_CDC_Plateforme_CEE.md`** : la Brique 2 (suivi des dépenses) **sort entièrement du périmètre** de la plateforme — elle devient un module de l'application de gestion interne du CEE, déjà réalisée par des tiers. Conséquence directe : le **niveau d'accès 3 disparaît**, remplacé par un modèle à 2 niveaux (visiteur/étudiant) + des **droits d'administration** (Éditeur/Modérateur/Admin) séparés et cumulables. Mentorat et RAESP retirés (gérés par la plateforme du réseau Alumni), Pédagogie/Xam Xam retirée (couverte par Hints). Nouvelle rubrique "Présentation" (vidéos YouTube de la Commission Communication).
- **`ADR_Identite_Ecosysteme_Etudiant.md`** puis **`Authentification-CEE.md`** : l'authentification est déléguée à un **moteur Keycloak mutualisé**, développé par une équipe dédiée, partagé avec Hints/Vote/Guide Logiciels. Connexion Google OAuth2 exclusivement. Exigences techniques précises : UUID Keycloak comme clé pivot (jamais l'email), filtrage de domaine applicatif (`@esp.sn`/`@gmail.com` uniquement), et surtout une **contrainte de résilience critique** — Keycloak purge les comptes inactifs après 6 mois sans garantie de synchronisation, donc **aucune donnée ne doit être en `CASCADE`** sur l'identité d'un utilisateur.
- **`Reunion_Design_System_2026-10-03.md`** : concept **"Polyspace"**, une barre de navigation verticale inter-plateformes obligatoire pour tout l'écosystème CEE (logos des apps, rétractable desktop, tiroir mobile).

### 2.3 Document pour l'équipe Design System

`CDC_Design_Plateforme_CEE.md` : cahier des charges orienté design envoyé au chef d'équipe Design System, avec inventaire complet des écrans par vue (Visiteur/Étudiant/Admin), composants transverses nécessaires, directives (mobile-first, WCAG, mode sombre, performance), et questions ouvertes.

---

## 3. Répartition en 5 modules

Le travail de développement est découpé en 5 modules **indépendants**, chacun avec son propre fichier détaillé dans le vault, un contrat d'interface documenté (pour que les autres modules puissent développer en mockant plutôt qu'en attendant), un schéma de base de données propre, et sa part du registre de points ouverts.

| Module | Fichier | Propriétaire | Dépendances entrantes |
|---|---|---|---|
| 1 — Fondations & Identité | `Module_Fondations_Identite.md` | Lead Dev (toi) | Aucune |
| 2 — Diffusion, Vitrine & Événements | `Module_Diffusion_Vitrine_Evenements.md` | Kakashi (GitHub `SerigneSaliouNiang`) | Module 1 (mockable) |
| 3 — Chatbot RAG | `Module_Chatbot_RAG.md` | Alioune Ndiaye (GitHub `alioune-cyber`) | Modules 1, 2 (mockables) |
| 4 — Réseau social | `Module_Reseau_Social.md` | Seynabou Ndiaye (par élimination, GitHub à confirmer) | Module 1 (mockable) |
| 5 — Administration & Comptes | `Module_Administration_Comptes.md` | Baye Elimane KA (GitHub `thesombrecoder18`) | Module 1 (mockable) |

Chaque fichier module intègre aussi les **18 règles d'ingénierie** fournies en session (4 états, try/catch/finally, retry backoff, cache TTL, pas de travail bloquant, pagination/mémoïsation, isolation, validation avant réseau, erreurs mappées, compatibilité, outbox offline, backup, checklist de fin de passe, 300 lignes max, tests obligatoires, sécurité active — les règles 17/18 natif/desktop marquées sans objet pour une stack 100% web), adaptées concrètement à chaque module.

---

## 4. Infrastructure GitHub

- Repo créé : [github.com/MADENIYOU/cee-platform](https://github.com/MADENIYOU/cee-platform), **public** (nécessaire pour activer la protection de branche gratuitement — le plan GitHub Free ne permet pas la protection de branche sur un repo privé).
- Branche `main` protégée par un **ruleset** : push direct refusé, force-push refusé, suppression de branche refusée, **Pull Request obligatoire** pour tout le monde y compris le propriétaire (`current_user_can_bypass: never`).
- 3 collaborateurs invités en `push` : `thesombrecoder18` (Baye Elimane KA), `SerigneSaliouNiang` (Kakashi), `alioune-cyber` (Alioune Ndiaye). Reste à inviter : Seynabou Ndiaye (username GitHub pas encore fourni).
- `.github/PULL_REQUEST_TEMPLATE.md` : checklist obligatoire reprenant les 18 règles, à cocher sur chaque PR.
- `.github/CODEOWNERS` : propriétaires par zone de code, à compléter au fur et à mesure.

---

## 5. Implémentation du Module 1 — Fondations & Identité

### 5.1 Stack technique

Next.js 16 (App Router, build forcé en `--webpack` — `@serwist/next` ne supporte pas encore Turbopack) · TypeScript strict · Tailwind CSS v4 + Radix (primitives accessibles) · **Auth.js v5** (provider Keycloak/OIDC) · Prisma 6 (schéma PostgreSQL `core`, multi-schema natif, pas de preview flag nécessaire) · Cloudflare R2 (upload, SDK S3) · Upstash Ratelimit en **token bucket** (demande explicite du Lead Dev) · Vitest (unitaire) + Playwright (E2E) + `@axe-core/playwright` (audit WCAG automatisé).

**Cache Components** (nouveau mode Next.js 16) volontairement **désactivé** : impose des Suspense boundaries et des directives `"use cache: private"` sur toute lecture de session — complexité jugée disproportionnée pour une équipe étudiante qui tourne chaque année.

### 5.2 Ce qui a été construit

- **Auth** : intégration Keycloak complète (`src/lib/auth/auth.config.ts`), provisioning JIT du profil local à la connexion, filtrage de domaine au niveau du callback `signIn`, rate limiting (token bucket) sur les tentatives de connexion elles-mêmes (pas seulement sur l'upload).
- **Contrat de session** (`src/lib/auth/session.ts`) : `getSession()`, `requireRole()`, `requireStudentDomain()` — exactement le contrat documenté dans `Module_Fondations_Identite.md` §2, pour que les modules 2 à 5 puissent coder contre sans attendre.
- **Journal d'audit** (`src/lib/audit/logAudit.ts`) : append-only, avec `actorNomSnapshot` écrit une fois et jamais recalculé — c'est ce qui garde le journal lisible après une purge Keycloak.
- **Upload partagé** (`src/lib/upload/`) : validation par sniffing des octets réels (pas le `Content-Type` déclaré), rejet des archives (ferme la classe de vulnérabilité "zip bomb"), stockage R2.
- **Layout `<AppShell>`** (`src/components/app-shell/`) : header/footer communs, barre Polyspace (rétractable desktop, tiroir accessible mobile via Radix Dialog), menu bifurqué par rôle, mode sombre (préférence système + toggle).
- **PWA** : manifest + service worker Serwist, exclusion explicite des routes d'auth du cache offline.
- **Schéma Prisma** (`prisma/schema.prisma`) : `User`, `AuditLog`, `WhitelistImport` — toutes les clés étrangères vers `User.id` en `ON DELETE SET NULL`, aucune en `CASCADE`.
- **Sécurité** : CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy (`next.config.ts`) ; CSRF par vérification d'`Origin` sur les mutations (`src/proxy.ts` — Next.js 16 a renommé `middleware.ts` en `proxy.ts`) ; validation stricte des variables d'environnement au démarrage via Zod (`src/lib/env.ts`), qui échoue vite plutôt que de laisser un bug silencieux apparaître en profondeur.
- **Infra de dev** : `docker-compose.dev.yml` avec Postgres + un Keycloak de test pré-seedé (`keycloak/realm-export.json`, realm `cee-dev`, 2 utilisateurs de test : un domaine autorisé, un domaine refusé) — permet à toute l'équipe de développer sans dépendre du Keycloak partagé réel.
- **CI/CD** : `.github/workflows/ci.yml` (lint, typecheck, `pnpm audit`, tests, build), `backup.yml` (dump PostgreSQL quotidien vers R2), `deploy.yml` en placeholder explicite (secrets Dokploy pas encore disponibles — pas de faux déploiement fabriqué).

### 5.3 Vérification réelle (pas seulement écrite)

Toute la suite a été **exécutée pour de vrai**, pas juste rédigée :

- `pnpm lint`, `pnpm typecheck`, `pnpm build` : verts
- **18 tests unitaires** (Vitest) : tous verts, y compris un test d'intégration contre une vraie PostgreSQL qui prouve la résilience à la purge (suppression directe d'un utilisateur → la ligne d'audit associée reste lisible, `actorId = null`, nom préservé)
- **8 tests E2E** (Playwright, contre un vrai Keycloak Docker) : parcours de connexion complet (Google OAuth → session créée), rejet réel d'un domaine non autorisé, CSRF vérifié (403 sur mauvaise origine)
- **Audit WCAG 2.1 AA automatisé** (axe-core) : 5/5 tests verts, **zéro violation** sur `/` et `/connexion`, en clair/sombre, desktop/mobile, y compris le menu Polyspace mobile avec focus trap et fermeture Échap vérifiés

### 5.4 Bugs réels trouvés et corrigés en cours de vérification

1. `create-next-app` a planté à mi-scaffold (bug connu avec `--dir .`) — scaffold reconstruit à la main
2. Realm Keycloak invalide (champ JSON `comment` non reconnu par le schéma strict de Keycloak) — Keycloak refusait de démarrer
3. **Cookies `Secure` actifs en HTTP local** : Auth.js les active dès `NODE_ENV=production` (donc avec `next start`), même sans HTTPS réelle — cassait silencieusement toute la connexion. Corrigé en dérivant `useSecureCookies` de l'URL réelle plutôt que du seul `NODE_ENV`.
4. **CSP trop stricte** (`script-src 'self'` sans `'unsafe-inline'`) : bloquait l'hydratation React de Next.js lui-même, donc le bouton de connexion ne faisait rien. Corrigé selon la recette officielle "Without Nonces" documentée par Next.js (le mode nonce aurait forcé un rendu dynamique sur toutes les pages, contraire à notre choix de simplicité).
5. `file-type` rejetait les `Buffer` Node sous certains runtimes de test — coercion explicite en `Uint8Array`
6. ESLint flat-config : `FlatCompat` + `eslint-config-next` produisait une erreur de structure circulaire — remplacé par l'import direct des exports flat-config du package (`eslint-config-next/core-web-vitals`, `/typescript`)
7. Sélecteurs de tests Playwright ambigus (le bouton "afficher le mot de passe" de Keycloak et l'annonceur de route de Next.js portent eux aussi `role="alert"`/`aria-label` contenant "password") — corrigés avec des locators plus précis

### 5.5 Ajouts faits suite à un rappel explicite du Lead Dev (pas présents au premier passage)

- try/catch/finally sur le provisioning JIT (upsert Prisma dans le callback `jwt`)
- Rate limiting sur la connexion elle-même, pas seulement sur l'upload
- Header HSTS
- `pnpm audit --audit-level=high` en CI (exigence explicite du cadrage, pas honorée au premier passage)
- Dépendance `zod` déclarée mais inutilisée → utilisée pour valider les variables d'environnement au démarrage

### 5.6 Corrections faites après l'ouverture de la PR du Module 1

Le premier passage de CI sur GitHub a révélé deux problèmes invisibles en local :

1. **Conflit de version pnpm** : `ci.yml` fixait `version: 12` sur `pnpm/action-setup` alors que `package.json` déclare déjà `packageManager: pnpm@12.10.1` — l'action refuse les deux sources à la fois (`ERR_PNPM_BAD_PM_VERSION`). Retiré le `version:` en dur.
2. **`pnpm audit --audit-level=high` a trouvé 20 vraies vulnérabilités** (6 critiques, 5 hautes), dont deux failles critiques réelles dans Auth.js (contournement d'auth, bypass homoglyphe sur la normalisation d'email). Corrigé :
   - `next-auth` 5.0.0-beta.25 → 5.0.0-beta.32, `@auth/core` 0.37.4 → 0.41.3 ;
   - `vitest` 2 → 5 (+ `@vitejs/plugin-react`, `vite-tsconfig-paths`, `jsdom` à jour), qui corrige deux RCE critiques par pollution de prototype dans `tinypool`/`vite` ;
   - `deepmerge-ts` forcé à `>=8.0.0` via un override pnpm (épinglé par `@prisma/config`, dans l'arbre de prod via `@prisma/client`) ;
   - seule exception restante, documentée explicitement dans `ci.yml` : `GHSA-vfj7-8cjw-p6xm` (braces, via `eslint-config-next`, lint-only, aucun correctif amont disponible).

Puis, en préparant le retour de revue du Module 5 (voir §6), une même classe de faille a été repérée **dans le Module 1 lui-même** : le fallback mémoire de `src/lib/rate-limit.ts` s'activait silencieusement en production si Upstash n'était pas configuré. Corrigé par un garde-fou qui échoue bruyamment si `AUTH_URL` pointe vers du `https://` (donc une vraie prod) — détection par schéma d'URL plutôt que par `NODE_ENV` seul, pour ne pas casser les tests E2E locaux/CI qui tournent eux aussi en `NODE_ENV=production` (`next build && next start`) sur `http://localhost`.

Toutes ces corrections ont été re-vérifiées de bout en bout (lint/typecheck/build/18 tests unitaires/8 E2E/CI GitHub) avant d'être poussées. **PR #1 mergée dans `main`.**

---

## 6. Intégration du Module 5 — Administration & Comptes

Premier module livré par un développeur de l'équipe (Baye Elimane KA), et premier test réel du processus d'intégration prévu par le découpage en modules.

### 6.1 Revue avant merge

Revue complète (fonctionnel, contrat d'interface, résilience à la purge, 18 règles, sécurité, UI/UX) : niveau jugé au-dessus du Module 1 sur plusieurs points — **102/102 tests unitaires, 26/26 E2E**, garde-fous anti-lock-out ajoutés de sa propre initiative (impossible pour un Admin de se retirer son propre rôle ou de retirer le dernier Admin), scoping serveur strict sur les imports/ajouts, choix de `read-excel-file` plutôt que SheetJS pour fermer par construction le vecteur "formule malveillante".

Un seul point corrigé avant merge : son mock de session (`src/lib/auth/session.ts`, propre à sa branche) lisait le profil depuis un cookie `cee_mock_profile` librement modifiable côté navigateur, sans garde sur l'environnement — même correction que celle du §5.6 appliquée à son fichier.

### 6.2 Fusion avec le vrai Module 1 — ce qui a été appris

Les deux branches (`feat/module-1-fondations-identite` et `feat/module-5-administration-comptes`) avaient été développées **sans ancêtre Git commun** (le repo était vide au moment où les deux ont démarré) : fusionner la PR du Module 5 dans `main` (qui contenait déjà le vrai Module 1) a produit **10 conflits**, tous sur le socle partagé — `package.json`, `pnpm-lock.yaml`, `.env.example`, `.github/CODEOWNERS`, `.github/workflows/ci.yml`, `README.md`, `AGENTS.md`, et les 3 fichiers explicitement annotés `MOCK — remplacé par le Module 1 à l'intégration` (`src/lib/auth/session.ts`, `src/components/app-shell/AppShell.tsx`, `src/app/page.tsx`).

Résolution : le vrai Module 1 remplace les mocks, le `CODEOWNERS`/`AGENTS.md` du Module 5 garde ses lignes actives (celles de `main` n'étaient que des placeholders commentés, antérieurs à son code réel), `package.json` fusionne les deux listes de dépendances.

Ce remplacement a révélé deux problèmes réels, invisibles jusque-là car aucun test du Module 1 n'exerçait la vraie chaîne de session sans la mocker :

1. **`next/server` ne se résout pas sous Vitest** : `next-auth` importe `next/server` sans extension ; Next.js 16 n'a pas de champ `exports` dans son `package.json`, donc la résolution ESM stricte de Node (utilisée par Vitest pour les dépendances externalisées, à la différence du bundler de Next.js lui-même) échoue sur ce specifier nu. Corrigé dans `vitest.config.ts` : alias `next/server` → `next/server.js`, et `next-auth`/`@auth/core` forcés dans le résolveur de Vite (`test.server.deps.inline`) pour que l'alias s'applique réellement.
2. **Le helper de test E2E du Module 5 (`useProfile()`) basculait de rôle via le cookie mock**, que le vrai `session.ts` ignore totalement. Remplacé par un vrai cookie de session Auth.js : le profil est écrit dans `core.users` (les rôles vivent exclusivement là, jamais dans Keycloak), puis un jeton est chiffré avec le même secret que le serveur (`@auth/core/jwt` `encode()`, salt = nom du cookie de session) — mêmes identités fixes qu'avant (Awa Admin, Aïssatou Étudiant, etc.), aucune assertion de test à changer.

Vérifié de bout en bout sur l'arbre fusionné : lint, typecheck, build, **110/110 tests unitaires (21 suites), 34/34 tests E2E** (Module 1 + Module 5 ensemble, y compris WCAG 2.1 AA sur les 6 écrans admin). **PR #2 mergée dans `main`.**

### 6.3 Incident GitHub Actions (résolu de lui-même)

Après un premier push de correctif sur la PR du Module 5, GitHub n'a déclenché **aucun run CI pendant environ 20 minutes**, malgré plusieurs tentatives (nouveau push, fermeture/réouverture de la PR) — aucun run en file d'attente, en cours ou en attente d'approbation, aucun incident signalé sur status.githubstatus.com. Résolu spontanément côté GitHub (dispatch de webhook qui a fini par repartir) ; aucune action de notre côté n'en a été la cause.

### 6.4 Nettoyage de l'historique Git — mention d'IA dans les commits

L'`AGENTS.md` propre à la branche du Module 5 interdit explicitement toute mention d'IA dans les commits/branches/PR. Les commits faits par l'assistant sur sa branche (correctif du mock de session, correctif CI, fusion) portaient une ligne `Co-Authored-By` — retirée par réécriture d'historique (`git commit-tree`, arbre de fichiers strictement identique, seuls les messages ont changé), puis force-push sur la branche (pas encore mergée à ce moment-là, donc sans risque pour `main`).

**Décision du Lead Dev, valable pour tout le projet à partir de maintenant : plus aucune mention d'IA dans aucun commit, sur aucune branche.** Les 5 commits du Module 1 déjà fusionnés dans `main` avant cette décision gardent la mention de façon permanente — les réécrire impliquerait de réécrire `main` lui-même, bloqué par le ruleset de branche (`non_fast_forward: blocked`, `current_user_can_bypass: never`) mis en place à la demande explicite du Lead Dev, et casserait la référence de fusion du Module 5 vers `main`. Accepté tel quel.

---

## 7. Rapport pour l'équipe Design System

`Demandes_Equipe_Design.md` : consolide les demandes design des **5 modules** (pas seulement le Module 1) — logo CEE, icônes PWA, couleur identitaire + palette (placeholders actuels donnés pour comparaison), statut Polyspace, et une section dédiée par module (OG image + icônes départements pour le Module 2, widget chat pour le Module 3, cartes/avatars/messagerie pour le Module 4, dashboard/import/table d'audit pour le Module 5).

---

## 8. Rapports d'avancement hebdomadaires

Trois rapports rétroactifs ont été rédigés et publiés dans le Drive partagé (`QG Commission IT` → `Plateforme CEE` → `Rapports d'avancement`), un par samedi depuis le début de la session (25 septembre 2026) : semaine du 26 septembre, du 3 octobre, du 10 octobre. À partir de la semaine prochaine, un seul rapport par samedi suffit, couvrant les 7 jours précédents.

---

## 9. État actuel et prochaines étapes

### Fait
- Cadrage produit complet et à jour (`Plateforme_CEE_Fusion.md`)
- 5 modules documentés et répartis
- Repo GitHub créé, protégé, 3/5 collaborateurs invités
- **Module 1 et Module 5 implémentés, revus, vérifiés et mergés dans `main`**
- Audit WCAG automatisé passé sur les deux modules
- Rapport Design System rédigé
- 3 rapports d'avancement hebdomadaires publiés dans le Drive de la Commission IT

### Reste à faire (pas de mon ressort ou explicitement différé)
- Obtenir l'username GitHub de Seynabou Ndiaye et l'inviter
- Envoyer `Demandes_Equipe_Design.md` à l'équipe Design System (couvre les 5 modules)
- Logo CEE, icônes PWA, palette définitive, contraste réel, test sur device mobile physique (en attente des livrables design)
- Démarrage effectif des modules 2, 3 et 4
- Tous les points du registre `Plateforme_CEE_Fusion.md` §12 encore ouverts (organigramme CEE, contrat d'API exact avec l'équipe auth, budget chatbot, sauvegardes PostgreSQL en production réelle, cloisonnement VPS, etc.)
- Rapport d'avancement du samedi suivant

---

## 10. Où trouver quoi

**Vault Obsidian** (`/Users/xpertech/Docs/MNAS/cee-platform/`) : tous les documents de cadrage — `Plateforme_CEE_Fusion.md` (référence produit), `CDC_Plateforme_CEE.md`, `Projet_plateforme_amicale.md`, `Retours_CDC_Plateforme_CEE.md`, `ADR_Identite_Ecosysteme_Etudiant.md`, `Authentification-CEE.md`, `Reunion_Design_System_2026-10-03.md`, `CDC_Design_Plateforme_CEE.md`, `Demandes_Equipe_Design.md`, les 5 fichiers `Module_*.md`.

**Code** (`/Users/xpertech/Developer/github/cee-platform/`) : ce repo, `main` à jour avec les Modules 1 et 5. `README.md` à la racine pour les instructions de setup local détaillées (démarrage de la stack Docker, variables d'environnement, tests). Le dossier `docs/` (apporté par la fusion du Module 5) contient une copie du cadrage, consultable directement depuis GitHub sans Obsidian.

**Drive** (`QG Commission IT` → `Plateforme CEE` → `Rapports d'avancement`) : les rapports d'avancement hebdomadaires.
