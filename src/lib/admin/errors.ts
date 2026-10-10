import { toHttpResponse } from "@/lib/auth/session";

/**
 * Erreur métier du Module 5, déjà mappée (règle d'ingénierie n°9) : porte
 * le statut HTTP et un message destiné à la personne, jamais une stack.
 */
export class AdminError extends Error {
  constructor(
    public readonly status: 400 | 404 | 409 | 422 | 502,
    message: string
  ) {
    super(message);
    this.name = "AdminError";
  }
}

/** Corps de requête illisible ou non conforme au schéma attendu. */
export const invalidBody = () => new AdminError(400, "Requête invalide.");

/** À utiliser dans le `catch` de chaque route du module. */
export function toAdminResponse(error: unknown): Response {
  if (error instanceof AdminError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  return toHttpResponse(error);
}
