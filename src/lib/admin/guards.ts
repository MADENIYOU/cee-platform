import "server-only";
import { ForbiddenError, UnauthorizedError, getSession } from "@/lib/auth/session";
import type { AppRole, AppSession } from "@/types/session";

export type ResponsableSession = AppSession & { classe: string };

/**
 * « Responsable de classe » est une permission attachée au statut Étudiant,
 * pas un rôle (Plateforme_CEE_Fusion.md §2) : `requireRole()` ne la couvre
 * pas. Sans classe connue, le périmètre « sa propre classe » n'existe pas,
 * donc l'accès est refusé.
 */
export async function requireResponsableClasse(): Promise<ResponsableSession> {
  const session = await getSession();
  if (!session) throw new UnauthorizedError();
  if (!session.isResponsableClasse || !session.classe) {
    throw new ForbiddenError("Permission « responsable de classe » requise");
  }
  return { ...session, classe: session.classe };
}

const ADMIN_ROLES: readonly AppRole[] = ["admin", "editeur", "moderateur"];

export function hasAdminAccess(session: AppSession | null): boolean {
  return !!session && session.roles.some((role) => ADMIN_ROLES.includes(role));
}

/** Instantané du nom de l'acteur, écrit une fois dans le journal d'audit. */
export function actorSnapshot(session: AppSession): string {
  return `${session.prenom} ${session.nom}`.trim();
}
