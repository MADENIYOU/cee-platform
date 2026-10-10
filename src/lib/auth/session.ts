import "server-only";
import { cache } from "react";
import { auth } from "@/lib/auth/auth.config";
import { isAllowedEmailDomain } from "@/lib/auth/domains";
import type { AppRole, AppSession } from "@/types/session";

/**
 * Contrat exposé aux modules 2 à 5 (voir Module_Fondations_Identite.md §2).
 * `null` = visiteur non connecté. Mémoïsée par React `cache()` pour ne lire
 * la session qu'une fois par rendu (Data Access Layer pattern recommandé
 * par Next.js 16, voir node_modules/next/dist/docs/01-app/02-guides/authentication.md).
 */
export const getSession = cache(async (): Promise<AppSession | null> => {
  const session = await auth();
  if (!session?.user) return null;

  return {
    userId: session.user.userId,
    email: session.user.email,
    nom: session.user.nom,
    prenom: session.user.prenom,
    departement: session.user.departement,
    classe: session.user.classe,
    promo: session.user.promo,
    roles: session.user.roles,
    isResponsableClasse: session.user.isResponsableClasse,
  };
});

export class ForbiddenError extends Error {
  constructor(message = "Accès refusé") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message = "Authentification requise") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * À utiliser dans chaque route protégée des modules 2 à 5. Lève une erreur
 * typée (à mapper en 401/403 par l'appelant) plutôt qu'un crash générique
 * — règle d'ingénierie n°9 (erreurs mappées).
 */
export async function requireRole(role: AppRole): Promise<AppSession> {
  const session = await getSession();
  if (!session) throw new UnauthorizedError();
  if (!session.roles.includes(role)) {
    throw new ForbiddenError(`Rôle "${role}" requis`);
  }
  return session;
}

/**
 * Garde défensive additionnelle (défense en profondeur) : le filtrage de
 * domaine est déjà appliqué au moment du sign-in (voir auth.config.ts),
 * mais certaines routes sensibles le revérifient explicitement.
 */
export async function requireStudentDomain(): Promise<AppSession> {
  const session = await getSession();
  if (!session) throw new UnauthorizedError();
  if (!isAllowedEmailDomain(session.email)) {
    throw new ForbiddenError("Domaine email non autorisé");
  }
  return session;
}

/** Petit utilitaire pour mapper nos erreurs typées vers une Response HTTP. */
export function toHttpResponse(error: unknown): Response {
  if (error instanceof UnauthorizedError) {
    return Response.json({ error: error.message }, { status: 401 });
  }
  if (error instanceof ForbiddenError) {
    return Response.json({ error: error.message }, { status: 403 });
  }
  console.error("[session] erreur non mappée", error);
  return Response.json({ error: "Erreur interne" }, { status: 500 });
}
