---
type: compte-rendu
titre: "Compte rendu réunion Design System — 3 octobre 2026"
source_url: "https://docs.google.com/document/d/154HNCpuLxa13wedSsFTN1vHYhBgc1SzaUBm1q13930w/edit"
tags: [cee, design-system, polyspace, compte-rendu]
date: 2026-10-03
---

# Compte rendu réunion du 3 Octobre 2026

> [!info] Source
> Copie locale du compte rendu Google Doc, conservée pour référence et liens Obsidian. Le document original fait foi en cas de divergence.

Présentation du design system et du concept Polyspace par Samba, puis choix de l'option 3 pour la plateforme du terrain de basket : lien depuis le Polyspace, authentification séparée de Keycloak.

## Design system

- Couleurs basées sur le logo du CEE (recommandées, non obligatoires), plus typographie, icônes, mouvements et composants.
- Le design de l'équipe membres est cité comme bon exemple d'application du design system.
- Le design system est déjà en place ; les fichiers sont partagés dans le groupe des chefs de projet.

## Concept Polyspace

- Barre de navigation verticale rétractable avec les logos des applications du CE ; l'application active est mise en surbrillance.
  - Sur mobile, un bouton unique ouvre la liste des applications du Polyspace.
- Inspiré du lanceur d'applications Google (Drive, Calendar), YouTube étant l'exception.
- **Minimum commun** : cette barre ; un header de même structure est souhaitable mais pas obligatoire.
- Débat technique : composant partagé ou recréé par chaque équipe, vu que certains utilisent React et d'autres Next.js.

## Logos

- Chaque équipe désigne une personne chargée de concevoir son logo, puis le remet à l'équipe Design System une fois finalisé.
- Logo du terrain de basket (une des 4 variantes envoyées) jugé bien, mais améliorable selon Bamba et Albert.

## Divers — Plateforme du terrain de basket

- Les gens de l'ENSEPT peuvent réserver le terrain mais ne doivent pas être intégrés au Polyspace, réservé à l'ESP.
- Trois options : retirer du Polyspace, mode non authentifié, ou authentification propre hors Keycloak (proposée par Django).
- Distinguer ESP et INSEPT jugé très compliqué : pas de mail INSEPT, pas de liste récupérable.
- Sans authentification, risques d'abus : réservations de 2 heures enchaînées, absences, pas d'annulation.

## Prochaines étapes

- (Chaque équipe) Proposer ses logos dans le groupe Google pour que Samba les récupère.

## Décisions prises

- Option 3 retenue : la plateforme du terrain de basket est liée depuis le Polyspace mais a sa propre authentification, hors Keycloak.
- La plateforme du terrain de basket n'aura pas la barre de navigation Polyspace (cas exceptionnel, comme YouTube chez Google).
- Le header et la barre Polyspace s'appliquent à la plateforme qui regroupe les jeux, pas à chaque jeu individuellement.

## 🔗 Références

- [[Plateforme_CEE_Fusion]] — impact sur la Plateforme CEE : voir §9 (navigation Polyspace) et §12 (registre, action logo)
- [[Authentification-CEE]] — architecture Keycloak, mentionnée pour le cas de la plateforme du terrain de basket
