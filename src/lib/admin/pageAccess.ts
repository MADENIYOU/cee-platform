import "server-only";
import { getSession } from "@/lib/auth/session";
import type { AppSession } from "@/types/session";

export type PageAccess =
  | { ok: true; session: AppSession }
  | { ok: false; session: AppSession | null; reason: "connexion" | "droits" };

/**
 * Contrôle d'accès d'une page (Server Component). Les routes d'écriture,
 * elles, utilisent `requireRole()` : la page ne fait que décider quoi
 * afficher, et ne charge aucune donnée quand l'accès est refusé.
 */
export async function resolvePageAccess(isAllowed: (session: AppSession) => boolean): Promise<PageAccess> {
  const session = await getSession();
  if (!session) return { ok: false, session, reason: "connexion" };
  if (!isAllowed(session)) return { ok: false, session, reason: "droits" };
  return { ok: true, session };
}

export const isAdmin = (session: AppSession) => session.roles.includes("admin");
