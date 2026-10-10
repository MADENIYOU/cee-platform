# Plateforme CEE — Module 1 : Fondations & Identité

Socle de la Plateforme CEE (ESP Dakar) : authentification déléguée (Keycloak
via OIDC), profil local, rôles, layout commun + barre Polyspace, PWA, upload
partagé. Les modules 2 à 5 consomment ce module via le contrat documenté
dans `Module_Fondations_Identite.md` (vault Obsidian `cee-platform`).

## Stack

Next.js 16 (App Router, Turbopack) · TypeScript strict · Tailwind CSS v4 +
shadcn/radix · Auth.js v5 (Keycloak/OIDC) · Prisma + PostgreSQL (schéma
`core`) · Cloudflare R2 (upload) · Upstash Ratelimit (token bucket) ·
Vitest + Playwright.

> ⚠️ Next.js 16 vient de sortir avec des changements de rupture par rapport
> aux versions précédentes — notamment `middleware.ts` renommé `proxy.ts`
> (voir `src/proxy.ts`), et un nouveau mode optionnel "Cache Components"
> **volontairement désactivé ici** (trop de complexité pour le bénéfice,
> voir `next.config.ts`). En cas de doute, se référer à
> `node_modules/next/dist/docs/` avant de copier un pattern d'une version
> antérieure de Next.js.

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

## Ce qui n'est PAS dans ce module

- Contenu métier (annonces, posts, chatbot) → modules 2 à 5.
- Écrans de gestion de la liste blanche (import Excel, ajout responsable
  de classe) → Module 5, qui écrit dans le schéma `core` défini ici.
- Déploiement réel (`deploy` job dans `ci.yml`) → en attente des secrets
  d'infra Dokploy/VPS.
- Vrai logo CEE → `public/icons/README.md`.
