## Résumé

<!-- Quoi, pourquoi, en 2-3 phrases. -->

## Module concerné

- [ ] Module 1 — Fondations & Identité
- [ ] Module 2 — Diffusion, Vitrine & Événements
- [ ] Module 3 — Chatbot RAG
- [ ] Module 4 — Réseau social
- [ ] Module 5 — Administration & Comptes

## Checklist (règles d'ingénierie, sécurité, UI/UX — obligatoire)

- [ ] 4 états couverts sur les écrans de données concernés (chargement/vide/erreur/succès)
- [ ] Appels réseau en `try/catch/finally`, erreurs mappées (jamais de stack brute affichée)
- [ ] Aucun secret en dur (clés, tokens) — tout en variables d'environnement
- [ ] Aucune `CASCADE` sur une clé étrangère vers `core.users.id` (toujours `SET NULL`)
- [ ] Aucun fichier de code ≥ 300 lignes
- [ ] Tests unitaires ajoutés/mis à jour pour la logique métier touchée
- [ ] Mobile-first vérifié (testé sur device réel si le changement touche l'UI)
- [ ] Mode sombre vérifié si le changement touche l'UI
- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` passent localement

## Lien avec le cadrage

<!-- Référence le fichier module / section Plateforme_CEE_Fusion.md concerné. -->
