---
type: module-dev
titre: "Module 5 — Administration & Gestion des comptes"
tags: [cee, plateforme, module, admin, comptes, audit]
proprietaire: À désigner
statut: prêt à démarrer (dépendances mockables)
date: 2026-10-06
sources:
  - "[[Plateforme_CEE_Fusion]]"
  - "[[Authentification-CEE]]"
---

# 🛡️ Module 5 — Administration & Gestion des comptes

> [!info] Rôle de ce module
> Porte la **couche d'administration des accès** : import de la liste blanche, gestion des permissions spéciales (responsable de classe), attribution des rôles (Éditeur/Modérateur/Admin), et consultation du journal d'audit transverse. C'est le pendant "gestion des identités" du Module 1 (qui fournit le moteur) — ce module fournit les **écrans opérationnels**.

> [!note] Stack technique
> Identique pour les 5 modules — Next.js (frontend + API routes), PostgreSQL (lit/écrit le schéma `core` du Module 1, pas de schéma propre), auth déléguée via le Module 1. Détail complet : [[Module_Fondations_Identite]] §3.

---

## 1. 🎯 Périmètre du module

### Ce qui est dans ce module
- Import Excel de la liste blanche par structure départementale (upload, aperçu d'erreurs avant validation, réimport sans doublon)
- Écran d'ajout d'un étudiant manquant par un responsable de classe (limité à sa propre classe, action tracée)
- Gestion des rôles : attribution/retrait d'Éditeur/Modérateur/Admin à un compte étudiant
- Consultation du journal d'audit transverse (table/filtre/pagination)
- Tableau de bord d'accueil admin (point d'entrée qui liste les fonctions disponibles selon le ou les rôles de la personne connectée)
- Déclenchement de la poussée de la liste blanche vers le moteur d'auth partagé (appel à l'API admin Keycloak, via le Module 1)

### Ce qui n'est PAS dans ce module
- Le moteur d'authentification lui-même, le contrat de session, le layout — **Module 1**
- Les écrans de création/édition de contenu métier (annonces, événements, FAQ, posts) — chacun **dans son propre module** (2, 3, 4)
- La synchronisation annuelle de masse (~7000 étudiants) — un **script séparé**, automatisé via l'API REST Keycloak, hors de ce module (voir [[Authentification-CEE]]) ; ce module couvre les ajustements **ponctuels** en cours d'année

---

## 2. 🤝 Contrat d'interface

### Dépendances entrantes

| Dépendance | Fournie par | Comment la mocker en attendant |
|---|---|---|
| `getSession()`, `requireRole("admin")` | Module 1 | Mock local avec rôle admin |
| Schéma `core.users`, `core.whitelist_imports`, `core.audit_log` | Module 1 | Créer ces tables localement avec le schéma documenté dans [[Module_Fondations_Identite]] §2, avant même que le Module 1 soit terminé — ce module **écrit directement** dans ces tables, donc le schéma (pas l'implémentation complète) est la vraie dépendance |
| Endpoint/API du moteur d'auth pour pousser la liste blanche | Module 1 (relais vers l'équipe auth externe) | Mock qui logge l'appel sans l'exécuter réellement, tant que le contrat d'API exact n'est pas confirmé (voir registre) |
| `<AppShell>` | Module 1 | Layout minimal temporaire |

**Aucune dépendance envers les Modules 2, 3, 4.**

### Ce que ce module expose aux autres

- Rien de requis par les autres modules pour démarrer — ils consomment indirectement les rôles que ce module attribue (via `core.users.roles`, propriété du Module 1), pas directement ce module.

### Schéma DB

Ce module ne possède pas de schéma propre — il **lit et écrit dans le schéma `core`** défini et possédé par le Module 1 (`users`, `whitelist_imports`, `audit_log`). C'est une exception volontaire à la règle "un schéma par module", justifiée par la nature de ce module (gestion opérationnelle d'un schéma partagé plutôt que propriétaire de données propres).

---

## 3. 🧱 Fonctionnalités détaillées

### 3.1 Import de la liste blanche

- **Écrans de gestion = responsabilité de ce module** : import Excel par structure départementale
- **Contrôle de l'import avant validation** : aperçu des erreurs (format d'adresse, doublons, classe inexistante), seules les lignes en erreur sont écartées, les autres passent
- **Réimport sans doublon** : l'adresse sert de clé, un réimport met à jour les comptes existants
- Après validation, ce module **pousse** les identités whitelistées vers le moteur d'auth partagé via son API (le moteur d'auth reste la source de vérité unique pour tout l'écosystème étudiant — pas seulement notre plateforme)

### 3.2 Ajout par le responsable de classe

- Écran simple : un étudiant avec la permission "responsable de classe" peut ajouter un étudiant manquant **à sa propre classe uniquement**
- **Aucun droit sur les adresses** existantes — uniquement la création de nouvelles entrées
- **Chaque ajout est tracé** (via `logAudit()`, fourni par le Module 1)

### 3.3 Gestion des rôles

- Attribution/retrait des droits Éditeur/Modérateur/Admin à un compte (écrit dans `core.users.roles`)
- Toute élévation de privilège est **loggée** (audit trail)

### 3.4 Journal d'audit

- Table de toutes les actions enregistrées par `logAudit()` **à travers tous les modules** (publication d'annonce, modération, attribution de rôle, import, etc.)
- Vue filtrable/paginée, probablement le composant le plus technique de ce module (table de données réutilisable)
- Chaque ligne reste lisible même si l'acteur a été purgé par Keycloak, grâce à `actor_nom_snapshot` (voir [[Module_Fondations_Identite]] §5)

### 3.5 Tableau de bord d'accueil admin

- Point d'entrée qui **n'affiche que les fonctions pertinentes** pour les rôles de la personne connectée (un Éditeur ne voit pas le journal d'audit réservé à l'Admin, etc.)
- Ce tableau de bord **ne reconstruit pas** les écrans de contenu des autres modules — il peut simplement proposer des liens vers leurs propres interfaces d'administration (ex. lien vers "Gérer les annonces" qui ouvre un écran du Module 2)

---

## 4. 🖥️ Écrans à construire

| Écran | Rôle | Détail |
|---|---|---|
| Tableau de bord admin (accueil) | Tous les rôles d'administration | Menu adapté au(x) rôle(s) |
| Import Excel + aperçu d'erreurs | Admin / structures départementales | Upload, validation, réimport sans doublon |
| Ajout étudiant manquant | Responsable de classe | Formulaire limité à sa classe |
| Gestion des rôles | Admin | Attribution/retrait Éditeur/Modérateur/Admin |
| Journal d'audit | Admin | Table filtrable/paginée |

---

## 5. 🔒 Résilience à la purge Keycloak

- Ce module est directement responsable de la **lisibilité du journal d'audit** après une purge — c'est lui qui consomme `actor_nom_snapshot` plutôt que de recalculer le nom depuis `core.users` à l'affichage
- Les imports eux-mêmes ne sont pas affectés par la purge (ils créent des comptes, n'en dépendent pas)

---

## 6. 📋 Points ouverts assignés à ce module

> [!info] Registre complet : [[Plateforme_CEE_Fusion]] §12

- [ ] **Contrat d'API précis avec l'équipe auth dédiée** pour la poussée de la liste blanche (endpoints exacts, format attendu) — en attendant, construire l'écran d'import avec l'appel API mocké (voir §2)
- [ ] **Concevoir avec les structures départementales le formulaire d'import** (colonnes exactes : nom, email, département, promo, classe) — à valider avec elles avant de figer le format Excel attendu
- [ ] **Validation du circuit de rédaction des mentions légales** — tangentiel à ce module si l'écran de gestion de contenu vitrine devait un jour vivre ici, mais reste dans le Module 2 ; pas d'action pour ce module

---

## 7. ✅ Critères d'acceptation (Definition of Done du module)

- [ ] Un import Excel avec des lignes en erreur affiche un aperçu clair, seules les lignes valides sont acceptées
- [ ] Un réimport ne crée jamais de doublon (l'adresse fait foi)
- [ ] Un responsable de classe ne peut ajouter un étudiant qu'à sa propre classe, jamais ailleurs
- [ ] Toute action de ce module (import, ajout, attribution de rôle) apparaît dans le journal d'audit
- [ ] Le journal d'audit reste lisible pour une action dont l'acteur a été purgé par Keycloak
- [ ] Le tableau de bord n'affiche que les fonctions pertinentes pour les rôles de la personne connectée
- [ ] La poussée de la liste blanche vers le moteur d'auth partagé fonctionne (ou est proprement mockée en attendant le contrat d'API définitif)

---

## 8. 🛠️ Règles d'ingénierie (checklist obligatoire)

> [!important] Référence complète des 18 règles : [[Module_Fondations_Identite]] §9 (rôles 17/18 sans objet, non répétés ici)

| N° | Règle | Application dans ce module |
|---|---|---|
| 1 | 4 états | Import Excel, journal d'audit, gestion des rôles : chargement/vide/erreur/succès — **l'aperçu d'erreurs d'import est un cas spécial d'état "succès partiel"** à bien distinguer des 4 états classiques |
| 2 | try/catch/finally | Sur le parsing du fichier Excel importé et sur l'appel à l'API admin du moteur d'auth (poussée de la liste blanche) |
| 3 | Retry backoff | Sur l'appel à l'API admin Keycloak (1s/3s/6s) — **jamais** sur un rejet de validation (ligne malformée), qui est définitif tant que le fichier n'est pas corrigé |
| 4 | Cache TTL | Journal d'audit : pas de cache long (60 s max), les admins doivent voir les actions récentes rapidement |
| 5 | Pas de travail bloquant | Le parsing d'un fichier Excel de ~7000 lignes potentielles **ne doit jamais bloquer l'interface** — traitement en job différé avec suivi de progression |
| 6 | Pagination et mémoïsation | **Journal d'audit = cas d'usage principal** : table paginée côté serveur, jamais tout charger ; liste des comptes importés également paginée |
| 7 | Isolation | Hérité du Module 1 — ce module ne manipule jamais directement un token, uniquement `getSession()`/`requireRole("admin")` |
| 8 | Validation avant réseau | Format du fichier Excel vérifié côté client (colonnes attendues) avant l'upload complet |
| 9 | Erreurs mappées | Une ligne d'import en erreur affiche la raison exacte (adresse invalide, classe inexistante...), jamais une erreur de parsing brute |
| 10 | Compatibilité | Écrans admin testés mobile-first comme le reste, même si l'usage réel sera probablement surtout desktop pour l'import en masse |
| 11 | Outbox offline | **À proscrire explicitement ici** : l'import de liste blanche et l'attribution de rôles sont des actions sensibles, **jamais mises en file offline ni rejouées automatiquement** |
| 12 | Backup | Hors scope direct pour ce module (porté par le Module 1), mais ce module **dépend directement** de la fiabilité de cette sauvegarde — à vérifier en intégration |
| 13 | Checklist de fin de passe | Vérifier systématiquement : chaque action de ce module génère bien une ligne d'audit, aucun import ne crée de doublon |
| 14 | 300 lignes max | Respecté, en particulier sur le composant de parsing/validation d'import (à isoler du composant d'affichage) |
| 15 | Tests obligatoires | Test explicite : un réimport du même fichier ne doit créer aucun doublon ; test E2E du parcours complet "import → aperçu erreurs → validation → poussée vers le moteur d'auth" |
| 16 | Sécurité active | Accès au journal d'audit et à la gestion des rôles strictement réservé au rôle Admin (`requireRole("admin")`), CSRF sur toutes les routes de mutation |
| 17 | État global centralisé | Sans objet |
| 18 | Module natif | Sans objet |

---

## 🔗 Références

- [[Plateforme_CEE_Fusion]] — §2, §2.2, §4, §12
- [[Authentification-CEE]] — cycle de vie des comptes, synchronisation annuelle
- [[Module_Fondations_Identite]] — schéma `core`, contrat de session
- [[CDC_Design_Plateforme_CEE]] — inventaire d'écrans (vue Admin)
