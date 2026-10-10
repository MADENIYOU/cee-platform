# Plateforme CEE — Module 5 : Administration & Gestion des comptes

Plateforme numérique du Comité Exécutif des Étudiants (CEE) — ESP Dakar.
Cette branche porte le **Module 5** : la couche d'administration des accès.

| Écran | URL | Réservé à |
|---|---|---|
| Tableau de bord | `/admin` | Éditeur, Modérateur, Admin, responsable de classe |
| Import Excel de la liste blanche, avec aperçu des erreurs | `/admin/comptes/import` | Admin |
| Comptes de la liste blanche | `/admin/comptes` | Admin |
| Gestion des rôles | `/admin/roles` | Admin |
| Journal d'audit | `/admin/audit` | Admin |
| Ajout d'un étudiant manquant | `/classe/ajouter-etudiant` | Responsable de classe |

Le cadrage complet est dans [`docs/`](docs/README.md), le périmètre du module
dans [`docs/modules/Module_Administration_Comptes.md`](docs/modules/Module_Administration_Comptes.md)
et l'état d'avancement dans [`docs/modules/HANDOFF_Module_5.md`](docs/modules/HANDOFF_Module_5.md).

> Le développement se fait module par module via des Pull Requests vers `main`
> (branche protégée : PR obligatoire, pas de push direct).

## Indépendant du Module 1

Ce module est développé sans attendre le Module 1 (Fondations & Identité),
comme le prévoit son contrat d'interface. Le socle (configuration, schéma
Prisma `core`, `logAudit`, protection CSRF) est une copie conforme de la
branche `feat/module-1-fondations-identite`. Trois fichiers sont des **mocks**
qui seront remplacés par ceux du Module 1 à l'intégration :

- `src/lib/auth/session.ts` : la session vient d'un profil factice ;
- `src/components/app-shell/AppShell.tsx` : layout minimal ;
- `src/app/page.tsx` : simple redirection vers `/admin`.

La poussée de la liste blanche vers le moteur d'authentification est elle
aussi mockée (`src/lib/admin/auth-engine/`), tant que le contrat d'API de
l'équipe auth n'est pas confirmé.

## Démarrage local

Prérequis : Node.js ≥ 20.9, pnpm, Docker.

```bash
cp .env.example .env            # CEE_MOCK_SESSION="admin" y est déjà
pnpm install
pnpm dev:stack                  # Postgres (+ Keycloak de dev, inutilisé ici)
pnpm prisma:generate
pnpm prisma migrate deploy      # crée le schéma « core »
pnpm dev                        # http://localhost:3000/admin
```

Si le port 5432 est déjà pris sur votre machine, lancez Postgres sur un autre
port et adaptez `DATABASE_URL` dans `.env` :

```bash
docker run -d --name cee-m5-dev-pg -p 127.0.0.1:5455:5432 \
  -e POSTGRES_USER=cee -e POSTGRES_PASSWORD=cee -e POSTGRES_DB=cee_platform postgres:16-alpine
```

### Changer de profil

`CEE_MOCK_SESSION` fixe le profil par défaut : `admin`, `editeur`,
`moderateur`, `responsable`, `etudiant` ou `visiteur`. Pour changer sans
redémarrer, posez le cookie `cee_mock_profile` avec l'une de ces valeurs
(c'est ce que font les tests E2E).

### Fichier d'import

Un fichier `.xlsx` dont la première ligne porte les colonnes **Nom, Prénom,
Email, Département, Promo, Classe** (ordre libre). Exemple prêt à importer :
`docs/exemples/liste-blanche-exemple.xlsx`. Le format exact et la liste des
classes restent à valider avec les structures départementales : ils sont
isolés dans `src/lib/admin/import/columns.ts`.

## Tests

```bash
pnpm lint && pnpm typecheck
pnpm test        # unitaires + intégration (l'intégration demande DATABASE_URL, sinon elle est ignorée)
pnpm build
pnpm test:e2e    # Playwright : parcours d'import, accès, rôles, accessibilité
```

`pnpm test` ne lit pas `.env` : exportez `DATABASE_URL` pour exécuter les
tests d'intégration (`set -a; . ./.env; set +a`).

## Stack

Next.js 16 (App Router, build `--webpack`) · TypeScript strict · Tailwind
CSS v4 · Prisma + PostgreSQL (schéma `core`) · Zod · read-excel-file ·
Vitest + Playwright + axe-core.

