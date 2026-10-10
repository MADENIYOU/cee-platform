---
type: handoff
titre: "Passation — Module 5 : Administration & Gestion des comptes"
tags: [cee, plateforme, module, admin, handoff]
proprietaire: Baye Elimane KA (thesombrecoder18)
date: 2026-10-10
sources:
  - "[[Module_Administration_Comptes]]"
  - "[[Module_Fondations_Identite]]"
---

# Passation — Module 5

Branche : `feat/module-5-administration-comptes`, créée depuis `main`,
indépendante de la PR du Module 1.

## 1. Ce qui est livré

| Fonctionnalité (doc module §3) | Où |
|---|---|
| 3.1 Import Excel, aperçu des erreurs, réimport sans doublon | `src/lib/admin/import/`, `src/components/admin/Import*.tsx`, `/admin/comptes/import` |
| 3.1 Poussée vers le moteur d'auth (mockée) | `src/lib/admin/auth-engine/` |
| 3.2 Ajout par le responsable de classe | `src/lib/admin/users/addStudentToClass.ts`, `/classe/ajouter-etudiant` |
| 3.3 Gestion des rôles et de la permission responsable de classe | `src/lib/admin/roles/`, `/admin/roles` |
| 3.4 Journal d'audit filtrable et paginé | `src/lib/admin/audit/`, `/admin/audit` |
| 3.5 Tableau de bord par rôle | `src/lib/admin/dashboardItems.ts`, `/admin` |
| Vue des comptes | `src/lib/admin/users/listUsers.ts`, `/admin/comptes` |

## 2. Critères d'acceptation (doc module §7)

| Critère | Preuve |
|---|---|
| Aperçu clair, seules les lignes valides passent | `validateRow.test.ts`, `import.integration.test.ts`, `admin-import.spec.ts` |
| Un réimport ne crée jamais de doublon | `import.integration.test.ts`, `admin-import.spec.ts` |
| Le responsable n'ajoute qu'à sa propre classe | `guards.test.ts`, `addStudent.integration.test.ts` |
| Toute action apparaît dans le journal d'audit | tests d'intégration (import, ajout, rôles) |
| Journal lisible après purge de l'acteur | `auditJournal.integration.test.ts` |
| Tableau de bord limité aux rôles de la personne | `dashboardItems.test.ts`, `admin-access.spec.ts` |
| Poussée vers le moteur d'auth | **mockée proprement**, voir §4 |

Vérifié le 2026-10-10 : lint, typecheck et build verts ; 84 tests Vitest
(dont 19 d'intégration sur PostgreSQL) ; 24 tests Playwright, dont l'audit
axe-core WCAG 2.1 AA des 6 écrans en clair et en sombre, en largeur mobile.

Non vérifié : test sur un téléphone réel, et comportement avec le vrai
moteur d'authentification.

## 3. Choix de conception

- **Import par paquets pilotés par le navigateur.** Le fichier est lu dans un
  Web Worker, validé localement pour l'aperçu, puis les lignes valides sont
  envoyées par paquets de 200 avec une barre de progression. Le serveur
  revalide chaque ligne. C'est la réponse à la règle n°5 sans file de tâches
  à héberger. Contrepartie : la page doit rester ouverte pendant l'import.
- **Aucun rejeu automatique** (règle n°11). Un paquet en échec arrête
  l'import et ramène à l'aperçu ; relancer est sans danger car l'adresse fait
  foi.
- **Poussée avant écriture.** Si le moteur d'auth refuse un paquet, rien de
  ce paquet n'est écrit en base.
- **Le journal ne joint jamais `core.users`.** Le nom affiché vient de
  `actor_nom_snapshot` ; un acteur purgé porte la mention « Compte supprimé ».
- **Garde-fous sur les rôles**, absents du cadrage mais nécessaires : un
  Admin ne peut pas se retirer son propre rôle, ni retirer le dernier Admin.
- **Bilan d'import** stocké dans `whitelist_imports.errors` (compteurs et
  lignes écartées, détail plafonné à 500), faute de colonnes dédiées dans le
  schéma du Module 1.

## 4. Mocks et bascule vers le Module 1

| Fichier | Rôle du mock | À l'intégration |
|---|---|---|
| `src/lib/auth/session.ts` | Session issue d'un profil factice | Prendre la version du Module 1 |
| `src/lib/auth/mockProfiles.ts` | Profils factices | Supprimer |
| `src/components/app-shell/AppShell.tsx` | Layout minimal | Prendre la version du Module 1 |
| `src/app/page.tsx` | Redirection vers `/admin` | Prendre la version du Module 1 |
| `src/lib/admin/auth-engine/mockAuthEngine.ts` | Poussée simulée | Ajouter l'adaptateur réel et le sélectionner dans `index.ts` |
| `tests/e2e/helpers.ts` | Changement de profil par cookie | Remplacer par une connexion Keycloak de test |

Conflits attendus à la fusion avec la PR du Module 1 : les quatre premiers
fichiers ci-dessus, plus `package.json` et `pnpm-lock.yaml` (dépendance
`read-excel-file`), `AGENTS.md`, `README.md`, `.env.example` et `CODEOWNERS`.
Le reste du socle est identique octet pour octet.

## 5. Points à trancher avec le Lead Dev

1. **Identifiant des comptes importés.** `core.users.id` doit être le `sub`
   Keycloak. Avec la poussée mockée, l'identifiant est provisoire, et le
   provisioning du Module 1 fait un `upsert` par `id` : à la première
   connexion d'un étudiant importé, l'adresse entrerait en collision. Il
   faut soit que l'API admin renvoie l'identifiant créé (prévu par le port
   `AuthEnginePort`), soit une réconciliation par adresse côté Module 1.
2. **Rôles figés dans le jeton.** Le Module 1 lit les rôles à la connexion
   seulement : un changement de rôle ne prend effet qu'à la reconnexion.
3. **Lien de navigation** vers `/classe/ajouter-etudiant` : `RoleNav`
   appartient au Module 1. Aujourd'hui l'écran n'est proposé que sur le
   tableau de bord.
4. **Statut « étudiant ».** Le schéma ne distingue pas un compte de la liste
   blanche d'un visiteur connecté ; ce module considère tout compte de
   `core.users` comme inscrit.

## 6. Points ouverts du registre (doc module §6)

- Contrat d'API de l'équipe auth pour la poussée de la liste blanche.
- Colonnes exactes du fichier et référentiel des classes, à valider avec les
  structures départementales : valeurs provisoires dans
  `src/lib/admin/import/columns.ts`.
- Rate limiting des routes d'administration : non posé ici (la brique du
  Module 1 n'est pas reprise), à brancher à l'intégration.
