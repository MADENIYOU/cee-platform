# Handoff — Plateforme CEE

Document de passation couvrant l'intégralité de la session de cadrage et de développement, du premier cahier des charges au Module 1 fonctionnel. Destiné à toute personne qui reprend ce travail (équipe, nouveau Lead Dev, board de la Commission IT).

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

---

## 6. Rapport pour l'équipe Design System

`Demandes_Equipe_Design.md` : consolide les demandes design des **5 modules** (pas seulement le Module 1) — logo CEE, icônes PWA, couleur identitaire + palette (placeholders actuels donnés pour comparaison), statut Polyspace, et une section dédiée par module (OG image + icônes départements pour le Module 2, widget chat pour le Module 3, cartes/avatars/messagerie pour le Module 4, dashboard/import/table d'audit pour le Module 5).

---

## 7. État actuel et prochaines étapes

### Fait
- Cadrage produit complet et à jour (`Plateforme_CEE_Fusion.md`)
- 5 modules documentés et répartis
- Repo GitHub créé, protégé, 3/5 collaborateurs invités
- Module 1 implémenté et **réellement vérifié** de bout en bout
- Audit WCAG automatisé passé
- Rapport Design System rédigé

### Reste à faire (pas de mon ressort ou explicitement différé)
- **Commit + push + PR** de ce travail (voir ci-dessous — `main` est protégée, passage par PR obligatoire)
- Obtenir l'username GitHub de Seynabou Ndiaye et l'inviter
- Envoyer `Demandes_Equipe_Design.md` à l'équipe Design System (couvre les 5 modules)
- Logo CEE, icônes PWA, palette définitive, contraste réel, test sur device mobile physique (en attente des livrables design)
- Démarrage effectif des modules 2 à 5 par chaque développeur
- Tous les points du registre `Plateforme_CEE_Fusion.md` §12 encore ouverts (organigramme CEE, contrat d'API exact avec l'équipe auth, budget chatbot, sauvegardes PostgreSQL en production réelle, cloisonnement VPS, etc.)

---

## 8. Où trouver quoi

**Vault Obsidian** (`/Users/xpertech/Docs/MNAS/cee-platform/`) : tous les documents de cadrage — `Plateforme_CEE_Fusion.md` (référence produit), `CDC_Plateforme_CEE.md`, `Projet_plateforme_amicale.md`, `Retours_CDC_Plateforme_CEE.md`, `ADR_Identite_Ecosysteme_Etudiant.md`, `Authentification-CEE.md`, `Reunion_Design_System_2026-10-03.md`, `CDC_Design_Plateforme_CEE.md`, `Demandes_Equipe_Design.md`, les 5 fichiers `Module_*.md`.

**Code** (`/Users/xpertech/Developer/github/cee-platform/`) : ce repo. `README.md` à la racine pour les instructions de setup local détaillées (démarrage de la stack Docker, variables d'environnement, tests).
