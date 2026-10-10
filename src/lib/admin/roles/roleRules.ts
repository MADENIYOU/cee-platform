/**
 * Règles de gestion des rôles — pures, testables sans base de données.
 */
import type { AppRole } from "@/types/session";

export const ASSIGNABLE_ROLES = ["editeur", "moderateur", "admin"] as const satisfies readonly AppRole[];

export const ROLE_LABELS: Record<AppRole, string> = {
  editeur: "Éditeur",
  moderateur: "Modérateur",
  admin: "Admin",
};

export type RoleChange = { added: AppRole[]; removed: AppRole[] };

export function diffRoles(before: readonly AppRole[], after: readonly AppRole[]): RoleChange {
  return {
    added: ASSIGNABLE_ROLES.filter((role) => after.includes(role) && !before.includes(role)),
    removed: ASSIGNABLE_ROLES.filter((role) => before.includes(role) && !after.includes(role)),
  };
}

export type AccessChangeContext = {
  actorId: string;
  targetId: string;
  targetClasse: string | null;
  change: RoleChange;
  nextIsResponsableClasse: boolean;
  /** Nombre de comptes Admin avant le changement. */
  adminCount: number;
};

/**
 * Renvoie la raison du refus, ou `null` si le changement est permis.
 * Empêche de se retrouver sans aucun Admin, donc sans personne pour gérer
 * les rôles.
 */
export function checkAccessChange(context: AccessChangeContext): string | null {
  const removesAdmin = context.change.removed.includes("admin");

  if (removesAdmin && context.actorId === context.targetId) {
    return "Vous ne pouvez pas retirer votre propre rôle Admin.";
  }
  if (removesAdmin && context.adminCount <= 1) {
    return "Impossible de retirer le dernier Admin de la plateforme.";
  }
  if (context.nextIsResponsableClasse && !context.targetClasse) {
    return "Ce compte n'a pas de classe : il ne peut pas être responsable de classe.";
  }
  return null;
}
