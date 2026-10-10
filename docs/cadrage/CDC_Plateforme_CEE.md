---
type: spec
titre: Cahier des charges — Plateforme CEE (vue externe + vue interne)
destinataire: Commission IT, CEE/ESP — développement, design, product
version: 1.0
date: 2026-08-29
responsable: Président Commission IT
---

# 📐 Cahier des charges — Plateforme CEE

Document de référence pour le développement de la Plateforme CEE. Il fixe **ce qui doit être construit**, par qui, dans quel ordre, et selon quels critères d'acceptation. Ce n'est pas une spec technique détaillée — c'est le contrat produit.

---

## 1. Objet

La **Plateforme CEE** est l'outil numérique **propre au Comité Exécutif des Étudiants** de l'ESP. Elle n'est pas une application tierce (contrairement à Yeekai) : elle est développée, hébergée, maintenue par des étudiants de l'ESP, sous la responsabilité de la Commission IT.

Elle porte **cinq briques** dans l'ordre de livraison suivant, sur **une seule plateforme, deux vues** :

| Vue | Public | Contenu |
|---|---|---|
| **Externe** | Visiteurs sans compte | Présentation des départements, actualités publiques, site vitrine |
| **Interne** | Étudiants membres connectés | Fil d'annonces, contenus pédagogiques, vidéos, échanges étudiants |

---

## 2. Contexte & Contraintes majeures

| Contrainte | Impact sur le produit |
|---|---|
| **Le canal de diffusion (brique 1) est le premier livrable** — il débloque la Phase 1 du projet Formations. | La brique 1 **ne doit pas attendre** la brique 5 (réseau social). Calendriers distincts sur même codebase. |
| **Le suivi des dépenses (brique 2) est une obligation réglementaire** (art. 23, 28 du Règlement Intérieur). | Doit être **privé, étanche**, avec circuit de validation défini par la Commission Finances. |
| **Trois niveaux d'accès** (visiteur / étudiant membre / membre CEE). | L'authentification et l'autorisation sont la **partie critique**, pas un détail. |
| **Inscription déléguée via structures départementales** (pas de base e-mail ESP). | Formulaire standardisé → export Excel → import masse. L'auth reste "ouverte" (non vérifiée). |
| **Développement interne, budget 0 FCFA, coût humain réel.** | Architecture simple, maintenable par des étudiants qui tournent chaque année. |
| **Identité CEE à fonder** (cyan = Yeekai, violet = Guide Logiciels). | PolySpace (socle commun) fournit la charte, pas l'inverse. |
| **Pas de chat temps réel au lancement.** | Infrastructure simple, pas de WebSocket/SSE en v1. |
| **Multicanal en parallèle** (WhatsApp, Yeekai, Plateforme CEE). | La plateforme ne prétend pas être l'unique source dès le début. |

---

## 3. Architecture de haut niveau

```
┌─────────────────────────────────────────────────────────────┐
│                    PLATEFORME CEE                           │
│  (une seule app, un seul déploiement, un seul domaine)      │
├─────────────────────────────────────────────────────────────┤
│  VUE EXTERNE (niveau 1)          │  VUE INTERNE (niveau 2)  │
│  ─────────────────────           │  ─────────────────────   │
│  • Site vitrine (brique 3)       │  • Réseau social (brique 5)│
│  • Canal diffusion (brique 1)    │    – Fil d'annonces        │
│    – Annonces publiques          │    – Contenus pédagogiques │
│    – Espace Commission Comm.     │    – Vidéos                │
│  • Présentation départements     │    – Échanges étudiants    │
│                                  │                            │
│  ─────────────────────           │  ─────────────────────   │
│  VUE PRIVÉE CEE (niveau 3)       │  (co-portée avec RAESP)  │
│  • Suivi dépenses (brique 2)     │                            │
│    – Enregistrement continu      │                            │
│    – Circuit validation Finances │                            │
│    – Restitution fin mandat      │                            │
│    – CHATBOT (brique 4)          │                            │
└─────────────────────────────────────────────────────────────┘
```

**PolySpace** = couche transversale (design tokens, composants, navigation, auth UI) partagée par toutes les briques.

---

## 4. Les 5 briques — Périmètre détaillé

### Brique 1 — Canal de diffusion (PRIORITÉ 1)

**Objectif** : Diffuser les annonces officielles du CEE, en particulier de la Commission Communication, et relayer les contenus du projet Formations.

**Public** : Étudiants (niveau 2) + visiteurs (niveau 1 pour la partie publique).

**Fonctionnalités** :
- Liste d'annonces chronologique, filtrable par commission/étiquette
- Annonces "publiées" visibles niveau 1 + 2 ; annonces "internes" niveau 2 uniquement
- Espace dédié Commission Communication (autonomie de publication)
- Pièces jointes (PDF, images) sur les annonces
- Recherche textuelle simple
- RSS / flux pour intégration externe (Yeekai, etc.)

**Critères d'acceptation** :
- [ ] Une annonce créée par la Com Communication est visible en < 2 min
- [ ] Un visiteur non connecté voit les annonces publiques
- [ ] Un étudiant connecté voit les annonces internes
- [ ] Le flux est accessible sans JS (SEO, accessibilité)

---

### Brique 2 — Suivi des dépenses (PRIORITÉ 2)

**Objectif** : Enregistrer les dépenses de **toutes les commissions** (pas seulement IT), selon le circuit de validation de la Commission Finances, et produire la restitution de fin de mandat.

**Public** : Membres du CEE uniquement (niveau 3 — **étanche**).

**Acteurs** :
- **Commission Finances** : définit le besoin (pièces, circuit, restitution) — **co-décideur**
- **Commission IT** : réalise techniquement
- **Tous membres du CEE** : soumettent leurs dépenses

**Fonctionnalités** :
- Création de dépense : montant, date, commission, catégorie, pièces justificatives (upload), commentaire
- Circuit de validation configurable (Finances valide → Président valide → Archivage)
- Tableau de bord : dépenses par commission, par période, par statut
- Export PDF/Excel de la restitution de fin de mandat
- Historique immuable (audit trail)
- **Authentification renforcée** (2FA recommandée pour niveau 3)

**Critères d'acceptation** :
- [ ] Une dépense soumise suit le circuit défini par Finances
- [ ] Un membre non-CEE ne peut **jamais** accéder à la liste des dépenses
- [ ] La restitution de fin de mandat est générée en 1 clic
- [ ] Audit trail complet : qui a créé/validé/modifié, quand

---

### Brique 3 — Site vitrine (PRIORITÉ 3)

**Objectif** : Présence web officielle du CEE, accessible aux visiteurs externes.

**Public** : Tout le monde (niveau 1).

**Fonctionnalités** :
- Page d'accueil : identité du CEE, actualités récentes (publiques), liens rapides
- Présentation des 6 départements / commissions
- Page "Qui sommes-nous" (bureau, mandat, règlement intérieur)
- Mentions légales, contact
- **Responsive, rapide, accessible** — c'est la vitrine

**Critères d'acceptation** :
- [ ] Lighthouse > 90 sur toutes les métriques
- [ ] Contenu modifiable sans redéploiement (CMS léger ou fichiers MD)
- [ ] Déployé sur le sous-domaine mutualisé (`cee.domaine.com`)

---

### Brique 4 — Chatbot administratif (PRIORITÉ 4)

**Objectif** : Répondre aux questions administratives récurrentes des étudiants (inscriptions, délais, procédures, contacts).

**Public** : Étudiants (niveau 2).

**Contraintes** :
- Remplace le projet "Chatbot WhatsApp" écarté
- Base de connaissances = documents du CEE + FAQ validée par la Com Communication
- Pas de LLM libre — réponses contrôlées, traçables
- Escalade vers humain si confiance < seuil

**Fonctionnalités** :
- Interface conversationnelle (texte)
- Base de connaissances versionnée (source : wiki CEE)
- Journal des conversations (anonymisé) pour améliorer la base
- "Je ne sais pas" → redirection vers contact humain

**Critères d'acceptation** :
- [ ] 80% des questions fréquentes résolues sans escalade
- [ ] Aucune hallucination sur les procédures officielles
- [ ] Réponse < 3s

---

### Brique 5 — Réseau social étudiant / Vue interne (PRIORITÉ 5, multi-mandat)

**Objectif** : Espace d'échange, de partage et de réseautage entre étudiants de l'ESP.

**Public** : Étudiants membres connectés (niveau 2).

**Co-porteur** : Réseau Alumni ESP (RAESP) — **modalités à établir**.

**Fonctionnalités (incrémentales)** :
1. Fil d'annonces / posts (texte, images, vidéos)
2. Groupes par département / promo / centre d'intérêt
3. Messagerie privée (différée, pas temps réel)
4. Profil étudiant (compétences, projets, recherche stage/alternance)
5. Annuaire (recherche par promo, département, compétences)
6. Mentorat (connexion étudiants ↔ alumni via RAESP)

**Critères d'acceptation** :
- [ ] Un étudiant connecté peut poster, commenter, réagir
- [ ] Modération communautaire (signalement) + modération admin
- [ ] Données exportables (RGPD)
- [ ] Déployable indépendamment des autres briques (feature flags)

---

## 5. Exigences transverses

### 5.1 Authentification & Autorisation (CRITIQUE)
- **3 niveaux** strictement séparés dans le code et l'UX
- **Inscription** : formulaire standardisé → Excel → import masse (pas d'email ESP)
- **Connexion** : email/mot de passe + option 2FA (TOTP) pour niveau 3
- **Session** : JWT courte durée + refresh token, stocké httpOnly
- **Rôles** : `visitor` | `student` | `cee_member` — middleware sur chaque route
- **Audit** : toute élévation de privilège loggée

### 5.2 Infrastructure
- **Hébergement** : VPS mutualisé (Contabo/DigitalOcean) via Dokploy + Traefik (comme Hints)
- **Domaine** : sous-domaine `cee.domaine.com` (domaine hérité, valide jusqu'en 2027)
- **Base de données** : PostgreSQL (unique, schémas par brique)
- **Backend** : Next.js (API routes) ou NestJS — pile déjà estimée pour le VPS
- **Frontend** : Next.js + React, SSR/SSG selon pages
- **CI/CD** : GitHub Actions → déploiement auto sur push `main`
- **Monitoring** : logs structurés, alertes basiques (uptime, erreurs 5xx)

### 5.3 Sécurité
- HTTPS obligatoire (TLS via Traefik/Let's Encrypt)
- CSP strict, headers de sécurité
- Validation stricte des uploads (type, taille, scan virus basique)
- Rate limiting sur auth et API publiques
- Dépendances : `npm audit` / `bun audit` en CI, mise à jour mensuelle
- **Revue de sécurité** avant mise en production du niveau 3 (dépenses)

### 5.4 Accessibilité & Qualité
- WCAG 2.1 AA minimum
- Mode sombre natif (PolySpace)
- Tests : unitaires (logique métier), E2E (parcours critiques)
- Lighthouse CI sur PR

### 5.5 Données & RGPD
- Minimisation : on ne collecte que l'essentiel (nom, département, promo, email)
- Droit à l'oubli : suppression complète du compte + données en 1 clic
- Export données : JSON complet du profil
- Conservation : données dépenses = durée mandat + 1 an ; données sociales = tant que compte actif

---

## 6. Parcours utilisateur clés (à maquettter)

| Parcours | Niveau | Priorité |
|---|---|---|
| Visiteur découvre le CEE, lit les actualités, voit les départements | 1 | Haute (vitrine) |
| Étudiant s'inscrit via sa structure, reçoit confirmation, accède au fil interne | 2 | Haute (onboarding) |
| Commission Communication publie une annonce, visible immédiatement | 1+2 | Haute (brique 1) |
| Membre CEE soumet une dépense, suit la validation, voit le tableau de bord | 3 | Haute (brique 2) |
| Étudiant pose une question au chatbot, obtient réponse ou escalade | 2 | Moyenne (brique 4) |
| Étudiant crée un post, rejoint un groupe, contacte un alumni | 2 | Progressive (brique 5) |

---

## 7. Jalons de livraison

| Jalon | Contenu | Échéance cible | Bloque |
|---|---|---|---|
| **M0 — Fondations** | Auth 3 niveaux, PolySpace tokens, CI/CD, déploiement staging | Semaine 1-2 | — |
| **M1 — Brique 1 (Diffusion)** | Annonces publiques + internes, espace Com Communication, RSS | Semaine 3-4 | Formations Phase 1 |
| **M2 — Brique 2 (Dépenses)** | CRUD dépenses, circuit validation Finances, export restitution, **revue sécurité** | Semaine 5-7 | Réglementation |
| **M3 — Brique 3 (Vitrine)** | Pages statiques, CMS léger, accessibilité | Semaine 8 | Image CEE |
| **M4 — Brique 4 (Chatbot)** | Base connaissances, conversation, escalade | Semaine 9-10 | — |
| **M5 — Brique 5 (Réseau social)** | MVP : fil, groupes, profil, messagerie différée | Semaine 11+ (multi-mandat) | RAESP |

> ⚠️ **M1 et M2 sont sur le chemin critique**. M3-M5 peuvent glisser sans bloquer d'autre projet.

---

## 8. Équipe & Rôles

| Rôle | Responsable | Notes |
|---|---|---|
| **Product Owner** | Président Commission IT | Arbitre le périmètre, valide les US |
| **Tech Lead** | À désigner (étudiant développeur expérimenté) | Architecture, revues de code, stack |
| **Dev Backend** | 2-3 étudiants (Commission IT + DGI + volontaires) | API, DB, auth, chatbot |
| **Dev Frontend** | 2-3 étudiants | Next.js, PolySpace, composants |
| **Design System** | 1-2 étudiants (voir CDC PolySpace) | Tokens, kit UI, maquettes |
| **QA / Tests** | 1 étudiant | E2E, accessibilité, sécurité |
| **Partenaire Finances** | Commission Finances | Co-décideur brique 2 |
| **Partenaire Communication** | Commission Communication | Contenu brique 1, chatbot |
| **Partenaire RAESP** | Réseau Alumni ESP | Co-porteur brique 5 |

**Recrutement** : articulation avec le processus en cours (voir `Commission_IT.md`) + Hackathons de l'Ingénieur pour produire des modules.

---

## 9. Risques & Mitigations

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| **Pas assez de devs étudiants** | Élevée | Retard toutes briques | Hackathons, modules autonomes, priorisation M1/M2 |
| **Finances ne définit pas le circuit à temps** | Moyenne | Bloque M2 | Atelier dédié semaine 1, deadlines claires |
| **RAESP ne répond pas / modalités floues** | Moyenne | Brique 5 bloquée | Brique 5 découplée, planning propre |
| **Fuite données dépenses (niveau 3)** | Faible | Critique (crédibilité) | Revue sécurité, 2FA, audit trail, isolation DB |
| **Identité visuelle non tranchée** | Moyenne | Incohérence UI | Atelier design semaine 1, décision Président |
| **Hébergement mutualisé insuffisant à la charge** | Faible à moyenne | Perf dégradée | Monitoring, provision budget R2, migration possible |

---

## 10. Définition de "Fait" (Definition of Done)

Une brique est "faite" quand :
- [ ] Code revu et mergé sur `main`
- [ ] Tests unitaires + E2E passent en CI
- [ ] Déployé sur staging, validé par PO
- [ ] Déployé sur production
- [ ] Documentation utilisateur (README brique) à jour
- [ ] Pas de vulnérabilité `high`/`critical` en audit
- [ ] Accessibilité validée (checklist WCAG)
- [ ] PolySpace respecté (tokens, composants)

---

## 🔗 Références
- Contexte mandat : [[Mandat]], [[Feuille_de_route_2026_2027]]
- Projet associé : [[Projet_Plateformes_CEE]] (ce document en est l'aboutissement)
- Vue interne co-portée : [[Projet_Reseau_Social_ESP]]
- CDC tiers à arbitrer : [[Plateforme_Amicale]], [[CDC_Projet_plateforme_amicale]]
- Socle commun : [[CDC_PolySpace]]
- Précédent méthodologique : [[CDC_Site_Guide_Logiciels]], [[DS_Site_Guide_Logiciels]]
- Cadre réglementaire : [[Reglement_Interieur_CEE]]
- Infrastructure : [[Projet_Hints]]

---

## ✅ Prochaines actions (pour la Commission IT)

- [ ] **Arbitrer la couleur identitaire CEE** (décision fondatrice pour PolySpace)
- [ ] **Atelier avec Commission Finances** : définir le circuit de validation des dépenses (pièces, seuils, restitution)
- [ ] **Identifier l'équipe de développement** (recrutement + Hackathons)
- [ ] **Configurer le sous-domaine** `cee.domaine.com` sur l'infra mutualisée Hints
- [ ] **Lancer le CDC PolySpace** auprès de l'équipe design system
- [ ] **Planifier M0** (fondations auth + PolySpace + CI/CD) — 2 semaines