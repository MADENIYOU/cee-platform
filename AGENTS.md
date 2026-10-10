<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Plateforme CEE — consignes pour les agents de code

Plateforme numérique du Comité Exécutif des Étudiants (ESP Dakar). Une seule
application Next.js, développée en 5 modules indépendants. Cette branche porte
le **Module 5 — Administration & Gestion des comptes**.

## À lire avant de coder

| Besoin | Fichier |
|---|---|
| Périmètre et critères d'acceptation du Module 5 | `docs/modules/Module_Administration_Comptes.md` |
| Contrat du Module 1 (session, rôles, audit, schéma `core`) | `docs/modules/Module_Fondations_Identite.md` §2 |
| Décisions produit et registre des points ouverts | `docs/cadrage/Plateforme_CEE_Fusion.md` §2, §4, §12 |
| Contraintes Keycloak (clé pivot, purge à 6 mois) | `docs/architecture/Authentification-CEE.md` |
| État du module, mocks, bascule vers le Module 1 | `docs/modules/HANDOFF_Module_5.md` |

## Commandes

```bash
pnpm install
pnpm dev:stack                 # Postgres + Keycloak de dev via docker compose
pnpm prisma:generate && pnpm prisma migrate deploy
pnpm dev                       # auth réelle via le Keycloak de dev (voir README.md)
pnpm lint && pnpm typecheck && pnpm test && pnpm build   # obligatoire avant tout commit de code
pnpm test:e2e
```

## Arborescence du Module 5

```
src/app/(admin)/        écrans (tableau de bord, comptes, import, rôles, audit, ajout par le responsable de classe)
src/app/api/admin/      routes de mutation réservées à l'Admin
src/app/api/classe/     route d'ajout par le responsable de classe
src/lib/admin/          logique métier, sans React
src/components/admin/   composants
tests/unit/admin/       tests Vitest
tests/e2e/              tests Playwright
```

Le socle (`src/lib/auth/`, `src/components/app-shell/`, `prisma/`) appartient
au Module 1 : ne pas le modifier depuis ce module, voir
`docs/modules/Module_Fondations_Identite.md` §2 pour son contrat.

## Règles Git

- **Jamais de push ni de commit sur `main`.** Tout le travail se fait sur
  `feat/module-5-administration-comptes` et arrive sur `main` par Pull Request.
- Jamais de `--force` sur une branche partagée, jamais de `--no-verify`.
- Commits conventionnels en français : `<type>: <description>` avec
  `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`.
- **Commits atomiques** : un commit = un seul changement cohérent. Un détail,
  même minime (une dépendance, une ligne de configuration, un renommage, un
  test), fait l'objet de son propre commit.
- **Aucune mention d'un assistant IA dans l'historique Git.** Interdit dans le
  titre, le corps et les trailers d'un commit, dans le nom d'une branche et
  dans le texte d'une Pull Request : les mots « Claude », « Claude Code »,
  « Anthropic », toute ligne `Co-Authored-By` désignant une IA, toute mention
  « Generated with … ». L'auteur d'un commit est le développeur.
- Ne jamais commiter `.env`, `.claude/` ni `docs/pdf/`.

## Règles d'ingénierie non négociables

La table complète des 18 règles est dans le document du Module 5 (§8). Les
points qui font échouer une revue :

1. **Autorisation** : chaque route d'écriture commence par
   `requireRole("admin")` (ou `requireResponsableClasse()` pour l'ajout à sa
   classe). Ne jamais manipuler un token, seulement `getSession()`.
2. **Audit** : chaque action du module (import, ajout, changement de rôle)
   appelle `logAudit()` avec `actorNomSnapshot`. Le journal s'affiche à partir
   de ce champ, jamais par jointure sur `core.users`.
3. **Purge Keycloak** : aucune clé étrangère vers `core.users.id` en
   `CASCADE`, toujours `SET NULL`.
4. **Import** : l'adresse est la clé, un réimport ne crée jamais de doublon.
   Le serveur revalide chaque ligne, même si le client l'a déjà fait.
5. **Jamais de file offline ni de rejeu automatique** pour l'import et les
   rôles. Le retry (1 s / 3 s / 6 s) ne concerne que l'appel au moteur d'auth,
   jamais une erreur 4xx ni une ligne invalide.
6. **Erreurs mappées** : un message lisible par ligne ou par action, jamais
   une erreur brute. Appels réseau en `try/catch/finally`.
7. **4 états** sur chaque écran de données : chargement, vide, erreur, succès
   (plus « succès partiel » pour l'aperçu d'import).
8. **Pagination côté serveur** pour le journal d'audit et les comptes.
9. **300 lignes maximum** par fichier de code.
10. **Tests d'abord** : test rouge, code, test vert. Aucun secret en dur.
11. **Mobile-first**, mode sombre, WCAG 2.1 AA.

## Schéma de données

Le Module 5 n'a pas de schéma propre : il lit et écrit `core.users`,
`core.whitelist_imports` et `core.audit_log`, propriété du Module 1. Ne pas
modifier `prisma/schema.prisma` sans accord du Lead Dev.
