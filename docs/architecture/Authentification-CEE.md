---
type: architecture
titre: "Architecture d'Authentification & Gestion des Identités Multi-Plateformes"
tags: [cee, auth, keycloak, ecosysteme]
date: 2026-10-06
---

# Architecture d'Authentification & Gestion des Identités Multi-Plateformes

Ce document consigne les choix d'architecture technique, les responsabilités de chaque brique (Keycloak vs Applications) et les procédures de cycle de vie des utilisateurs pour l'écosystème applicatif (Hints, Plateforme de vote, etc.).

> [!info] Impact Plateforme CEE
> Voir [[Plateforme_CEE_Fusion]] §2.2 pour la façon dont ces exigences sont intégrées à notre spec (clé pivot UUID, filtrage de domaine, résilience à la purge).

---

## 1. Principes Fondamentaux de Conception

* **Séparation stricte Identité vs Autorisation :**
  * **Keycloak (IdP) :** Gère uniquement l'identité (« Qui es-tu ? ») via Google OAuth. Il stocke `nom`, `prénom`, `email` et l'état d'activation (`enabled`).
  * **Applications métier (ex: Hints) :** Gèrent l'intégralité des rôles, permissions et contraintes organisationnelles (« Qu'as-tu le droit de faire ? »).
* **Identifiant Pivot Unique :**
  * L'UUID Keycloak (claim `sub` dans le JWT) sert de clé primaire (`id UUID`) dans la table locale `users` de chaque application.
  * L'adresse email peut évoluer sans casser l'intégrité référentielle des données métier.
* **Aucun Provisioning Libre :**
  * Pas d'inscription ouverte. Seuls les étudiants pré-chargés dans Keycloak peuvent accéder aux services.

---

## 2. Filtrage des Domaines de Messagerie

Bien que Keycloak délègue la connexion à Google OAuth, le filtrage des adresses autorisées est renforcé au niveau applicatif :

* **Domaines autorisés :** `@esp.sn` et `@gmail.com`.
* **Domaines rejetés :** Tous les autres (notamment `@ucad.edu.sn`).
* **Mise en œuvre :** Lors du décodage du token JWT (ou de la lecture des en-têtes injectés par le Reverse Proxy), chaque backend applicatif valide le suffixe du champ `email`. Si le domaine n'est pas autorisé, l'accès est rejeté immédiatement avec un code HTTP `403 Forbidden`.

---

## 3. Cycle de Vie Annuel & Script d'Upsert (Rentrée Académique)

L'annuaire compte environ 7 000 étudiants. La synchronisation annuelle est entièrement automatisée via l'API REST d'administration de Keycloak pour éviter toute intervention manuelle.

## 4. Directive d'Architecture : Résilience face à la Purge des Identités

### ⚠️ Contexte & Risque Technique
Keycloak applique une suppression définitive des comptes inactifs après une période de dormance (6 mois). Lors de cette purge :
* L'UUID pivot (`sub`) disparaît définitivement du référentiel central d'identité.
* Aucun événement de synchronisation n'est garanti vers les bases applicatives locales.

**Exigence :** La suppression d'un compte sur Keycloak ne doit **en aucun cas** compromettre l'intégrité de la base de données locale d'une application, ni rendre une ressource critique orpheline ou corrompue.

---

### Règles de Conception pour les Applications
Chaque équipe ou application conserve la totale liberté de sa modélisation interne, mais doit obligatoirement respecter les deux impératifs suivants :

1. **Bannir le `CASCADE` destructeur sur l'identité :**
   * L'effacement d'un profil étudiant local ne doit pas supprimer les données d'intérêt collectif qu'il a générées (ex. : cours déposés, annales d'examens, bulletins de vote clos, logs d'audit).
2. **Garantir la persistance de l'historique :**
   * Si une entité métier doit rester compréhensible ou vérifiable après le départ d'un étudiant, l'application doit prévoir un mécanisme pour conserver l'information textuelle ou l'état de l'action sans dépendre de l'existence active du compte.

---
