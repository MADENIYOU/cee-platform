# Icônes PWA — placeholder

Ce dossier doit contenir `icon-192.png` et `icon-512.png` (fond transparent
ou couleur CEE), référencés par `src/app/manifest.ts`.

**Volontairement absents de ce commit** : pas de logo réel disponible pour
l'instant. Générer de fausses icônes aurait été trompeur. Voir
`Plateforme_CEE_Fusion.md` §9 et le registre §12 — une personne doit être
désignée pour concevoir le logo CEE et le transmettre à l'équipe Design
System ; une fois reçu, déposer les deux fichiers PNG ici.

En attendant, l'app reste fonctionnelle et installable (le manifest pointe
vers des fichiers manquants, ce qui dégrade l'icône affichée sans empêcher
l'installation PWA).
