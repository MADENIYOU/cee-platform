/**
 * Contrat de session exposé aux 4 autres modules — voir
 * Module_Fondations_Identite.md §2. Ne pas modifier la forme de ce type
 * sans mettre à jour les 5 fichiers modules dans le vault Obsidian.
 */
export type AppRole = "editeur" | "moderateur" | "admin";

export type AppSession = {
  userId: string; // UUID Keycloak (claim `sub`) — clé pivot, PAS l'email
  email: string;
  nom: string;
  prenom: string;
  departement: string | null;
  classe: string | null;
  promo: string | null;
  roles: AppRole[];
  /** Permission spéciale attachée au statut Étudiant, pas un rôle. */
  isResponsableClasse: boolean;
};
