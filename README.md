# Plateforme CEE

Plateforme numérique du Comité Exécutif des Étudiants (CEE) — ESP Dakar,
développée en 5 modules indépendants sur une base commune (Module 1).
**Modules intégrés dans `main` :**

- **Module 1 — Fondations & Identité** (socle) : authentification déléguée
  (Keycloak via OIDC), profil local, rôles, layout commun + barre
  Polyspace, PWA, upload partagé. Les autres modules le consomment via le
  contrat documenté dans `Module_Fondations_Identite.md`
  (vault Obsidian `cee-platform`, aussi copié dans `docs/modules/`).
- **Module 5 — Administration & Comptes** : import Excel de la liste
  blanche, gestion des comptes et des rôles, journal d'audit, ajout d'un
  étudiant par un responsable de classe.

| Écran | URL | Réservé à |
|---|---|---|
| Accueil | `/` | Tous |
| Connexion | `/connexion` | Visiteur |
| Tableau de bord admin | `/admin` | Éditeur, Modérateur, Admin, responsable de classe |
| Import Excel de la liste blanche | `/admin/comptes/import` | Admin |
| Comptes de la liste blanche | `/admin/comptes` | Admin |
| Gestion des rôles | `/admin/roles` | Admin |
| Journal d'audit | `/admin/audit` | Admin |
| Ajout d'un étudiant manquant | `/classe/ajouter-etudiant` | Responsable de classe |

Modules 2 à 4 (Diffusion/Vitrine/Événements, Chatbot RAG, Réseau social) :
pas encore démarrés, voir `docs/modules/`.

## Stack

Next.js 16 (App Router) · TypeScript strict · Tailwind CSS v4 + shadcn/radix
· Auth.js v5 (Keycloak/OIDC) · Prisma + PostgreSQL (schéma `core`) ·
Cloudflare R2 (upload) · Upstash Ratelimit (token bucket) · `read-excel-file`
(import de liste blanche) · Vitest + Playwright.

> ⚠️ Build et dev forcés en `--webpack` (`pnpm dev`/`pnpm build`) : Serwist
> (service worker PWA) ne supporte pas encore Turbopack. Voir
> `next.config.ts`.

> ⚠️ Next.js 16 vient de sortir avec des changements de rupture par rapport
> aux versions précédentes — notamment `middleware.ts` renommé `proxy.ts`
> (voir `src/proxy.ts`), et un nouveau mode optionnel "Cache Components"
> **volontairement désactivé ici** (trop de complexité pour le bénéfice,
> voir `next.config.ts`). En cas de doute, se référer à
> `node_modules/next/dist/docs/` avant de copier un pattern d'une version
> antérieure de Next.js.

> ⚠️ Les rôles (Éditeur/Modérateur/Admin) et le statut "responsable de
> classe" vivent exclusivement dans `core.users` (ce dépôt) — jamais dans
> Keycloak, qui ne connaît que l'identité. Voir `Authentification-CEE.md`.

## Démarrage local

### 1. Prérequis

- Node.js ≥ 20.9, pnpm (`npm i -g pnpm`), Docker.

### 2. Stack de dev (Postgres + Keycloak pré-seedé)

```bash
cp .env.example .env
# Remplir au minimum AUTH_SECRET (générer avec: npx auth secret)
pnpm dev:stack          # démarre Postgres + Keycloak (docker compose)
```

Le Keycloak de dev simule le moteur d'auth partagé de l'écosystème CEE —
realm `cee-dev` pré-seedé avec :
- `etudiant.test@esp.sn` / `test1234` → domaine **autorisé**, doit réussir.
- `etudiant.refuse@ucad.edu.sn` / `test1234` → domaine **refusé**, doit être
  rejeté par `signIn` (voir `src/lib/auth/domains.ts`).

Console d'admin Keycloak : http://localhost:8080 (`admin` / `admin`).

### 3. Base de données

```bash
pnpm install
pnpm prisma:generate
pnpm prisma:migrate      # crée le schéma "core"
```

### 4. Lancer l'app

```bash
pnpm dev
```

→ http://localhost:3000

### 5. Tests

```bash
pnpm test                # unitaires (Vitest) — DATABASE_URL requis pour
                          # le test de résilience à la purge, sinon il est
                          # ignoré automatiquement
pnpm test:e2e             # E2E (Playwright) — nécessite la stack de dev
                          # démarrée ET le build de prod (lancé auto par
                          # playwright.config.ts)
```

## Variables d'environnement

Voir `.env.example`, commenté. **Ne jamais committer `.env`.**

## Bascule vers le vrai moteur d'auth partagé

En production, changer uniquement `AUTH_KEYCLOAK_ISSUER` / `AUTH_KEYCLOAK_ID`
/ `AUTH_KEYCLOAK_SECRET` pour pointer sur le moteur partagé de l'écosystème
(voir `Authentification-CEE.md`). Aucun code à modifier — le Keycloak de
dev respecte le même protocole OIDC standard.

## Runbook — restauration d'une sauvegarde

Les dumps sont produits quotidiennement par `.github/workflows/backup.yml`
vers `s3://$R2_BUCKET/backups/backup-AAAA-MM-JJ.sql.gz`. Pour restaurer :

```bash
# 1. Télécharger le dump voulu depuis R2 (console Cloudflare ou aws-cli)
# 2. Décompresser puis restaurer sur une base cible (JAMAIS directement sur prod sans vérification) :
gunzip -c backup-2026-10-10.sql.gz | psql "$DATABASE_URL_CIBLE"
```

Ce test de restauration doit être exécuté au moins une fois manuellement
avant la mise en production (voir critère d'acceptation du module).

## Ce qui n'est pas encore construit

- Contenu métier des modules 2 à 4 (annonces/vitrine/événements, chatbot,
  réseau social) — pas encore démarrés.
- Déploiement réel (`deploy` job dans `ci.yml`) → en attente des secrets
  d'infra Dokploy/VPS.
- Vrai logo CEE, palette de couleurs définitive, icônes PWA → placeholders
  en attente de l'équipe Design System, voir `public/icons/README.md` et
  `docs/design/`.
