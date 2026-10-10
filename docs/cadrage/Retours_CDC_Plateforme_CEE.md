---
type: retours
destinataire: Chef de projet de la Plateforme CEE
objet: Cahier des charges — Plateforme CEE, version 1.0 du 2026-08-29
date: 2026-09-27
tags: []
---

# 📝 Retours sur le cahier des charges de la Plateforme CEE (v1.0)

Relecture du cahier des charges « Plateforme CEE (vue externe + vue interne) », version 1.0 du 29/08/2026. Les retours suivent l'ordre des sections du CDC.

Ils relèvent de **deux registres**, qu'il ne faut pas confondre :

- **À prendre en compte** : des faits ou des décisions déjà actés côté CEE, que le CDC doit refléter.
- **Suggestions** : des pistes que nous proposons. Le chef de projet reste libre de les retenir, de les adapter ou de les écarter.

Une annexe argumentée accompagne la note sur la question de l'identité : [[ADR_Identite_Ecosysteme_Etudiant]].

---

## 1. À prendre en compte

| # | Fait ou décision | Conséquence sur le CDC |
|---|---|---|
| 1 | **La pédagogie est déjà couverte par [[Projet_Hints]].** | Retirer les « contenus pédagogiques » de la vue interne (§1, brique 5). Les porter sur la plateforme ferait doublon avec Hints. |
| 2 | **Le design system a déjà été réalisé par l'équipe design system.** | La plateforme consomme ce design system existant. Tout ce qui le présente comme un chantier à ouvrir est à retirer (voir §7, §8, §9, §10 et prochaines actions). |
| 3 | **Le suivi des dépenses devient un module de l'application de gestion interne du CEE**, déjà réalisée par des tiers. On reprend cette application et on y ajoute le suivi des dépenses. | La brique 2 et le jalon M2 sortent du CDC. Les exigences de la brique 2 (circuit de validation défini par la Commission Finances, historique immuable, restitution de fin de mandat, confidentialité) restent valables, mais pour ce module. |
| 4 | **Le niveau d'accès 3 n'a plus d'objet sur la plateforme.** | Il n'existait que pour les dépenses. La plateforme compte **deux niveaux** (visiteur, étudiant), plus des droits d'administration. Le 2FA et la revue de sécurité « niveau 3 » partent avec la brique 2. |
| 5 | **L'authentification se fait par connexion Google (OAuth2).** | Le §5.1 (e-mail et mot de passe, JWT et refresh token maison) est à réécrire. La plateforme ne gère plus aucun mot de passe. |
| 6 | **La Commission Communication va produire des vidéos de présentation** des campus, des départements, du campus social et de la vie étudiante. | Créer une rubrique **« Présentation »** en vue externe (niveau 1). |
| 7 | **Le chatbot de la plateforme n'a pas le même rôle que Rita (Yeeguide, Yeekai).** Rita aide surtout à se situer (carte 3D) et intervient sur la marketplace. Le chatbot de la plateforme est un **RAG sur les données de la plateforme** : les événements publiés par la Com, et les questions propres à chaque département et aux bureaux d'inscription. | Réécrire l'objectif de la brique 4 dans ce sens (voir plus bas). |
| 8 | **Le mentorat est traité sur la plateforme du réseau Alumni** ([[Projet_Reseau_Alumni]]). | Retirer la fonctionnalité « Mentorat » de la brique 5. |
| 9 | **La relation avec le RAESP se traite directement avec lui, en dehors de ce CDC.** Ce n'est pas un point bloquant pour la plateforme. | Retirer le RAESP de la brique 5 (co-porteur), du jalon M5 (colonne « Bloque »), de l'équipe (§8) et des risques (§9). |

---

## 2. Retours section par section

### §1 Objet
- Vue interne : retirer « contenus pédagogiques » (voir le point 1 ci-dessus). Pour les **vidéos**, préciser qu'il s'agit uniquement des médias joints aux posts du réseau social. Les vidéos de présentation, elles, vont dans la vue externe (point 6).

### §2 Contraintes
- Retirer les lignes « Le suivi des dépenses est une obligation réglementaire » et « Identité CEE à fonder ».
- Remplacer « L'auth reste "ouverte" (non vérifiée) » par : **connexion Google, réservée aux étudiants importés** via les structures départementales.

### Brique 1 — Canal de diffusion (suggestions)
- **Notifications.** Aucun mécanisme ne prévient l'étudiant qu'une annonce est publiée. Or c'est ce qui fait la force de WhatsApp. Pistes :
  - des notifications push, avec une plateforme installable sur le téléphone (PWA) ;
  - un aperçu soigné des liens, pour relayer chaque annonce dans une chaîne WhatsApp officielle, conformément à la stratégie multicanale décidée le 10/08 ;
  - un résumé par e-mail.
- **Rôle de publication.** Prévoir un rôle dédié à la publication, attribuable aux personnes habilitées. Le « filtre par commission » n'est pas nécessaire pour cela.
- **Ciblage.** Pouvoir adresser une annonce à un département ou à une classe.
- **Catalogue Formations.** Aucune fonctionnalité ne couvre la Phase 1 de [[Projet_Plateforme_Formations]] : publier et tenir à jour la liste des formations des clubs. Sans elle, M1 ne débloque pas réellement Formations.
- **Publication.** Prévoir le brouillon, l'épinglage et une **date d'expiration** : une annonce d'événement doit disparaître une fois l'événement passé.
- **Événements structurés.** Distinguer les **événements** (date, lieu) des simples annonces, en reprenant l'idée de calendrier du CDC de l'Amicale. Le chatbot en a besoin pour répondre de façon fiable (voir la brique 4).
- **Flux RSS « pour Yeekai ».** Vérifier que Yeekai sait lire un flux RSS. Sinon, le retirer.

### Brique 2 — Suivi des dépenses
- Sortie du CDC (point 3). La remplacer par un simple renvoi vers le module de l'application de gestion interne.

### Brique 3 — Site vitrine (suggestions)
- Ajouter la rubrique **« Présentation »** (point 6), alimentée par la Commission Communication : campus, départements, campus social, vie étudiante.
- **Hébergement des vidéos.** Plutôt qu'un stockage sur le serveur de la plateforme, les publier sur une **chaîne YouTube du CEE** et les intégrer au site. La lecture s'adapte au débit, rien n'est stocké côté serveur, et la Com garde la main sur ses vidéos.
- **Critère « Lighthouse > 90 ».** Les lecteurs vidéo intégrés font baisser ce score. Prévoir un chargement différé : on affiche une miniature, et le lecteur ne se charge qu'au clic.

### Brique 4 — Chatbot (suggestions)
- **Objectif.** Le réécrire selon le point 7 et ajouter une phrase qui distingue ce chatbot de Rita. Tel qu'il est formulé aujourd'hui (« questions administratives récurrentes »), un lecteur extérieur y verra un doublon de Rita.
- **Dépendance au contenu.** Le chatbot répond à partir de ce que publient la brique 1 et la rubrique Présentation. L'ordre M1 → M3 → M4 est donc cohérent, mais il faut que le contenu des départements et des bureaux d'inscription **existe et soit tenu à jour**. Il reste à dire par qui.
- **Réponses sourcées.** Chaque réponse renvoie vers l'annonce ou la page d'où elle vient, et le chatbot répond « je ne sais pas » s'il ne trouve rien. C'est ce qui rend l'exigence « aucune hallucination » tenable.
- **Données à jour.** L'index du RAG doit suivre les publications, les modifications et les expirations d'annonces. Sans cela, le chatbot présentera comme « à venir » un événement déjà passé.
- **Respect des niveaux d'accès.** Le chatbot ne doit jamais citer une annonce interne à un visiteur non connecté. Sa recherche doit filtrer selon le niveau de la personne qui pose la question.
- **Public.** Les événements et les informations des départements sont en grande partie publics. On peut envisager d'ouvrir le chatbot aux visiteurs, avec une limite du nombre de questions.
- **Critères mesurables.** « 80 % des questions fréquentes » : mesurés sur quelle liste de questions de référence, et par qui ?

### Brique 5 — Réseau social (suggestions)
- Retirer le mentorat (point 8) et la mention du RAESP comme co-porteur (point 9).
- **Profil « recherche de stage/alternance ».** Préciser comment il s'articule avec les offres que publie déjà la plateforme du réseau Alumni.
- **Modération.** Le CDC prévoit une modération communautaire et admin, sans dire qui modère au quotidien. Prévoir un rôle de **modérateur**.
- **Critère d'adoption.** Les critères d'acceptation sont techniques (poster, commenter). Or le vrai risque d'un réseau social, c'est qu'il reste vide. Ajouter un critère d'usage, par exemple un nombre d'étudiants actifs au bout de trois mois.
- **Groupes automatiques.** Les groupes par département et par promo peuvent être créés à partir de l'annuaire des comptes, sans saisie manuelle.

### §5.1 Authentification et autorisation (suggestions)
La connexion Google est actée (point 5). Il reste une question qu'elle ne règle pas : **Google prouve l'identité d'une personne, pas son appartenance à l'ESP.** Nos suggestions sont détaillées et argumentées dans [[ADR_Identite_Ecosysteme_Etudiant]]. En résumé :
- **Liste blanche.** Seuls les étudiants importés depuis les listes des structures départementales obtiennent le statut « étudiant ». Tout autre compte Google reste visiteur.
- **Ajout par le responsable de classe.** Il peut ajouter un étudiant manquant à **sa seule classe**, chaque ajout étant tracé. ⚠️ Cela revient sur la décision du 10/08, qui avait écarté l'ajout manuel par les délégués de classe (voir [[2026-08-10_Commission_Communication]]). Nous l'estimons acceptable parce qu'il est limité à la classe, tracé, et sans droit de modifier les adresses. Mais ce choix doit être assumé explicitement.
- **Un seul annuaire pour tout l'écosystème étudiant** (plateforme CEE, Hints, Vote, Guide Logiciels), via un fournisseur d'identité central : Keycloak. Un étudiant importé une fois est reconnu partout et se connecte une seule fois. L'application de gestion interne du CEE reste en dehors.
- **Rôles.** Éditeur (Commission Communication), Admin (Commission IT), Structure départementale, Responsable de classe, Modérateur.
- **Cycle de vie des comptes** : contrôle de l'import avant validation, réimport sans doublon, changement d'adresse réservé aux structures et à l'admin, désactivation en fin d'année, suppression au bout de 12 mois.
- **À vérifier en premier :** si les adresses **@esp.sn** des étudiants sont des comptes Google Workspace, la connexion Google peut vérifier seule l'appartenance à l'ESP, et la liste blanche se simplifie beaucoup.

### §5.2 Infrastructure (suggestions)
- Prévoir **plusieurs serveurs**, dont éventuellement le cloud mis à disposition par un enseignant, plutôt qu'un seul serveur mutualisé.
- **Trancher la stack** (« Next.js ou NestJS »). Une piste est de l'aligner sur Hints et le Guide Logiciels, pour que les mêmes développeurs passent d'un projet à l'autre.
- **Sauvegardes.** Aucune sauvegarde de la base PostgreSQL n'est prévue. Il faut des sauvegardes automatiques, stockées sur un autre serveur, et une restauration testée.
- **Pièces jointes.** Préciser où sont stockés les PDF et les images des annonces.
- **Domaine.** Il est « valide jusqu'en 2027 » : qui le renouvelle, et comment ?

### §5.3 Sécurité (suggestions)
- La revue de sécurité « avant mise en production du niveau 3 » perd son objet. La reporter sur **l'authentification et l'import des comptes**, qui deviennent la partie sensible.
- Le **CSP strict** doit autoriser les lecteurs vidéo intégrés, sinon la rubrique Présentation ne s'affiche pas.

### §5.4 Accessibilité et qualité
- Remplacer « Mode sombre natif (PolySpace) » par « conforme au design system existant ».

### §5.5 Données personnelles (suggestions)
- **Cadre légal.** Remplacer « RGPD » par le cadre sénégalais : la loi n° 2008-12 sur la protection des données à caractère personnel, sous le contrôle de la CDP (Commission de protection des données personnelles). Vérifier si le traitement doit être déclaré à la CDP.
- **Conservation.** Retirer la durée de conservation des données de dépenses. Ajouter celle des comptes désactivés et celle du journal du chatbot.
- **Chatbot.** Ne transmettre aucune donnée personnelle au service qui le fait tourner.

### §6 Parcours utilisateurs (suggestions)
- **Retirer** : « Membre CEE soumet une dépense… » et « contacte un alumni ».
- **Modifier** : l'étudiant ne « s'inscrit » plus lui-même. Il est importé par sa structure, puis se connecte avec Google.
- **Ajouter** :
  - un responsable de classe ajoute un étudiant manquant ;
  - l'Éditeur publie une annonce ou un événement ;
  - un visiteur regarde les vidéos de présentation.

### §7 Jalons (suggestions)

| Jalon | Retour |
|---|---|
| M0 — Fondations | « Auth 3 niveaux » devient deux niveaux et des rôles. « PolySpace tokens » est à retirer (design system existant). |
| M1 — Diffusion | Ajouter le catalogue Formations. |
| M2 — Dépenses | Supprimé (point 3). |
| M3 — Vitrine | Ajouter la rubrique Présentation. Elle dépend des vidéos produites par la Com : c'est une dépendance de **contenu**, à planifier avec elle. |
| M4 — Chatbot | Dépend du contenu publié en M1 et M3. |
| M5 — Réseau social | Retirer « RAESP » de la colonne « Bloque ». |

- **Dater les jalons.** « Semaine 1-2 » n'a pas de point de départ, et le CDC date du 29/08.
- **Vérifier la capacité de l'équipe.** Hints, Vote, Guide Logiciels et la plateforme CEE comptent sur les mêmes recrues de la Commission IT, dont le recrutement n'est pas terminé. Le risque est déjà au §9, mais le planning n'en tient pas compte.
- **Fusionner M1 et M3** en une première mise en ligne publique. Sans M2, rien ne justifie de les séparer, et la plateforme aurait une première version visible plus tôt.

### §8 Équipe et rôles (suggestions)
- **Retirer** : le rôle « Design System » (qui devient un simple interlocuteur de l'équipe design system), le partenaire Finances et le partenaire RAESP.
- **Ajouter** :
  - les **structures départementales**, pour la fourniture des listes d'étudiants ;
  - la **Commission Communication comme productrice de contenu** (vidéos, événements, informations des départements) ;
  - un **responsable de l'identité**, si le fournisseur d'identité central est retenu.
- **Tech Lead « à désigner ».** C'est un préalable à M0, pas un détail.

### §9 Risques (suggestions)
- **Retirer** : « Finances ne définit pas le circuit à temps », « RAESP ne répond pas », « Identité visuelle non tranchée », « Fuite données dépenses ».
- **Ajouter** :
  - **La plateforme n'est pas adoptée** et WhatsApp reste le réflexe (c'est le risque principal) ;
  - **le contenu n'est pas alimenté** : sans vidéos ni informations sur les départements, la vitrine est vide et le chatbot n'a rien à dire ;
  - **les listes des structures départementales arrivent en retard** : les étudiants ne peuvent pas se connecter au lancement ;
  - **le service d'identité tombe en panne** : plus personne ne se connecte nulle part ;
  - **le domaine expire en 2027**.

### §10 Définition de « fait »
- Remplacer « PolySpace respecté » par « design system existant respecté ».
- Ajouter : « sauvegardes en place et restauration testée ».

### Références et CDC de l'Amicale (suggestions)
- **Références.** Ajouter [[Projet_Hints]] comme outil de référence pour la pédagogie, la plateforme du réseau Alumni pour le mentorat, et l'application de gestion interne pour les dépenses.
- **CDC de l'Amicale.** La plupart des questions qu'il soulevait sont tranchées par les points ci-dessus : Xam Xam relève de Hints, l'Alumni de la plateforme Alumni, la présentation et les actualités de la plateforme. Nous suggérons d'**écrire cet arbitrage explicitement dans le CDC**, notamment si « Amicale » désigne le CEE, plutôt que de le laisser en « référence à arbitrer ». Voir [[Plateforme_Amicale]].

### Prochaines actions du CDC (suggestions)
- **Retirer** : « Arbitrer la couleur identitaire CEE », « Atelier avec Commission Finances », « Lancer le CDC PolySpace ».
- **Ajouter** :
  - vérifier auprès de l'administration si les adresses @esp.sn sont des comptes Google Workspace ;
  - concevoir le formulaire d'import avec les structures départementales ;
  - fixer avec la Commission Communication le calendrier de production du contenu (vidéos, départements, bureaux d'inscription) ;
  - trancher la stack ;
  - dater les jalons.

---

## 🔗 Liens & Références
- Projet concerné : [[Projet_Plateformes_CEE]]
- Annexe : [[ADR_Identite_Ecosysteme_Etudiant]]
- Réunion de cadrage avec la Commission Communication : [[2026-08-10_Commission_Communication]]
- Projets liés : [[Projet_Hints]], [[Projet_Plateforme_Formations]], [[Projet_Reseau_Social_ESP]], [[Projet_Reseau_Alumni]]
- Distinction avec Rita : [[Yeekai]]
