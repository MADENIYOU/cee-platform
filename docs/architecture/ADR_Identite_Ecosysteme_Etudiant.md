---
type: adr
statut_adr: propose
date: 2026-09-27
tags: []
---

# ADR-001 : Identité et accès de l'écosystème étudiant

**Statut :** Proposé. C'est une suggestion jointe aux [[Retours_CDC_Plateforme_CEE]] ; la décision revient au chef de projet de la Plateforme CEE.
**Date :** 2026-09-27
**Décideurs :** chef de projet de la Plateforme CEE, Commission IT

## Contexte

- **La connexion Google (OAuth2) est actée.** Les étudiants se connectent avec leur compte Google, et aucune plateforme ne gère de mot de passe.
- **Google prouve l'identité d'une personne, pas son appartenance à l'ESP.** Tout le monde a un compte Gmail. Aucune base d'adresses ou de numéros d'étudiants n'a été fournie au CEE (voir [[2026-08-10_Commission_Communication]]).
- **L'inscription est déléguée aux structures départementales** : un formulaire standardisé produit un fichier Excel, qui est importé en masse.
- **Plusieurs plateformes étudiantes partagent le même public** : la plateforme CEE, [[Projet_Hints]], [[Projet_Plateforme_Vote]] et [[Projet_Guide_Logiciels_Etudiants]]. La fiche Hints prévoit déjà une administration générale « via la plateforme CEE ».
- **Besoin exprimé :** un étudiant importé une fois doit pouvoir accéder à toutes les plateformes, sans nouvelle inscription et, idéalement, en ne se connectant qu'une fois. Le responsable de classe doit pouvoir ajouter les étudiants de sa classe qui manquent.
- **Contraintes :**
  - budget de 0 FCFA ;
  - auto-hébergement sur Dokploy ;
  - une équipe étudiante qui change chaque année, donc une **passation** difficile ;
  - plusieurs serveurs à venir.
- **Hors périmètre :** l'application de gestion interne du CEE (environ 16 utilisateurs, avec le module de suivi des dépenses) garde sa propre authentification. L'intégrer ajouterait de la complexité sans bénéfice.

## Décision proposée

1. **Un fournisseur d'identité central, Keycloak**, auto-hébergé. Il s'appuie sur Google pour la connexion et fournit l'identité aux plateformes étudiantes via OpenID Connect.
2. **Liste blanche.** Les étudiants sont créés à l'avance par import. Une connexion Google n'est acceptée comme « étudiant » que si l'adresse existe déjà. Sinon, la personne reste visiteur.
3. **Les écrans de gestion vivent dans la plateforme CEE** : import Excel et ajouts par les responsables de classe. Ces écrans appellent l'API d'administration de Keycloak. Keycloak stocke les identités ; la plateforme CEE fournit l'interface.
4. **Chaque plateforme crée son profil local à la première connexion**, à partir des informations transmises par Keycloak (département, classe, rôles).

## Options étudiées

### Option A : la plateforme CEE sert d'annuaire, sans fournisseur d'identité

| Dimension | Évaluation |
|---|---|
| Complexité | Faible |
| Coût | Nul, aucun service en plus |
| Connexion unique | Non : un clic « Se connecter avec Google » par plateforme |
| Passation | Simple |

**Avantages :** aucun service de plus à héberger, et une mise en œuvre dans la stack déjà prévue.
**Inconvénients :** chaque plateforme doit interroger l'annuaire de la plateforme CEE. On ne se connecte pas une fois pour toutes. Les rôles sont éparpillés entre les plateformes.

### Option B : Keycloak *(retenue)*

| Dimension | Évaluation |
|---|---|
| Complexité | Moyenne à élevée, maîtrisée si on n'en utilise qu'une petite partie |
| Coût | Nul en licence ; environ 512 Mo à 1 Go de mémoire |
| Connexion unique | Oui |
| Passation | Excellente documentation et très grande communauté |

**Avantages :** vraie connexion unique, standard OpenID Connect, groupes et rôles centralisés, liste blanche possible via le parcours de première connexion, et une compétence recherchée en entreprise.
**Inconvénients :** beaucoup de concepts à apprendre, une interface dense, et une configuration facile à casser si elle n'est pas versionnée.

### Option C : Zitadel

| Dimension | Évaluation |
|---|---|
| Complexité | Moyenne, avec des concepts plus clairs |
| Coût | Nul en licence ; léger (Go) |
| Connexion unique | Oui |
| Passation | Bonne documentation, communauté plus réduite |

**Avantages :** plus léger que Keycloak, et ses « organisations » correspondent naturellement aux départements.
**Inconvénients :** moins répandu, donc moins de ressources quand un futur responsable sera bloqué.

### Option écartée : faire de la plateforme CEE un fournisseur d'identité maison

On économiserait un service, mais une équipe étudiante écrirait elle-même la brique la plus sensible de l'écosystème. Une faille ou une panne toucherait toutes les plateformes.

## Analyse des compromis

Ce qui départage les options, c'est la **passation**. Zitadel est plus simple et plus léger. Mais dans deux ans, un nouveau membre de la Commission IT bloqué sur un problème trouvera une réponse pour Keycloak bien plus facilement. L'argument de la mémoire, qui plaidait pour Zitadel, pèse moins avec plusieurs serveurs. Zitadel reste le bon second choix si les ressources redeviennent une contrainte.

L'option A reste valable si la connexion unique n'est pas jugée nécessaire. Dans ce cas, chaque plateforme demande un clic Google, et c'est l'annuaire de la plateforme CEE qui fait foi.

## Modèle de rôles et de groupes

- **Groupes :** un par département et par classe (`/departements/<departement>/<classe>`).

| Rôle | Périmètre | Droits |
|---|---|---|
| `etudiant` | Lui-même | Accès à la vue interne |
| `responsable_classe` | Sa classe | Ajouter un étudiant manquant, sans suppression ni modification d'adresse |
| `structure_dept` | Son département | Importer la liste du département, corriger une adresse, confirmer les désactivations |
| `editeur` | Contenus | Publier des annonces et des événements (Commission Communication) |
| `moderateur` | Réseau social | Traiter les signalements |
| `admin` | Tout | Administration technique et imports (Commission IT) |

L'ajout par le responsable de classe revient sur la décision du 10/08, qui avait écarté l'ajout manuel par les délégués de classe. Nous le jugeons acceptable pour trois raisons : il est limité à sa propre classe, chaque ajout est tracé, et il ne donne aucun droit sur les adresses. C'est le même principe que [[Projet_Hints]] : la responsabilité humaine plutôt qu'un circuit de validation.

## Cycle de vie des comptes

1. **Import.** Le fichier est contrôlé avant d'être pris en compte (format des adresses, doublons, classe existante), avec un aperçu des erreurs. Seules les lignes en erreur sont écartées. Un réimport met à jour les comptes existants sans créer de doublon, l'adresse servant de clé.
2. **Première connexion.** La liste blanche repose sur l'adresse. Dès la première connexion, le compte est rattaché à l'identifiant Google permanent de l'étudiant, qui ne change jamais.
3. **Changement de compte Gmail.** On modifie l'adresse du compte existant, sans en créer un nouveau. Ce droit est réservé à la structure départementale et à l'admin, car c'est l'action la plus sensible du système.
4. **Fin d'année.** Les structures réimportent leurs listes. Les absents sont signalés, puis désactivés (pas supprimés) après confirmation. Un compte désactivé depuis 12 mois est supprimé. Les diplômés rejoignent la plateforme du réseau Alumni.
5. **Traçabilité.** Toute action sur un compte est enregistrée avec son auteur et sa date.

## Conséquences

**Ce qui devient plus simple :**
- une seule inscription et une seule identité pour toutes les plateformes étudiantes ;
- aucun mot de passe à gérer ;
- une nouvelle plateforme se branche via un standard ;
- les groupes du réseau social peuvent être créés automatiquement.

**Ce qui devient plus difficile :**
- Keycloak devient un **point de défaillance unique** : il faut des sauvegardes de sa base, une surveillance de sa disponibilité, et l'héberger sur le serveur le plus fiable ;
- il faut un **responsable de l'identité** au sein de la Commission IT ;
- sa configuration doit être **versionnée dans Git** (export du realm ou Terraform), et rien ne doit être modifié à la main sans être reporté dans Git.

**À réexaminer :**
- **Adresses @esp.sn.** Si elles sont des comptes Google Workspace, on peut accepter automatiquement tout le domaine. La liste blanche ne sert plus alors qu'à préciser le département et la classe.
- **Consommation mémoire** de Keycloak une fois les serveurs connus.

## Actions proposées
1. [ ] Vérifier auprès de l'administration de l'ESP si les adresses @esp.sn sont des comptes Google Workspace.
2. [ ] Concevoir avec les structures départementales le formulaire d'import (nom, adresse Gmail, département, promo, classe).
3. [ ] Désigner un responsable de l'identité au sein de la Commission IT.
4. [ ] Monter un Keycloak de test avec la connexion Google et la liste blanche, et versionner sa configuration dès le départ.
5. [ ] Brancher une première plateforme (la plateforme CEE), puis Hints.

## 🔗 Liens & Références
- Note de retours : [[Retours_CDC_Plateforme_CEE]]
- Projet concerné : [[Projet_Plateformes_CEE]]
- Plateformes concernées : [[Projet_Hints]], [[Projet_Plateforme_Vote]], [[Projet_Guide_Logiciels_Etudiants]]
- Décision d'origine sur l'inscription : [[2026-08-10_Commission_Communication]]
