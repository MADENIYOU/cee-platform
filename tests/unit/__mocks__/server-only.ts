// Stub pour les tests : le package "server-only" de Next.js ne fait rien
// à l'exécution, il déclenche juste une erreur de build si importé côté
// client. Vitest n'a pas ce concept de bundle client/serveur — on le
// remplace simplement par un module vide pour les tests.
export {};
