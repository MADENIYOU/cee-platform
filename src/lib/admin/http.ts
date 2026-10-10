import type { z } from "zod";
import { AdminError, invalidBody } from "@/lib/admin/errors";
import { idParamSchema } from "@/lib/admin/schemas";

/** Lit et valide le corps JSON d'une requête ; toute anomalie devient un 400 mappé. */
export async function readJson<Schema extends z.ZodTypeAny>(
  request: Request,
  schema: Schema
): Promise<z.infer<Schema>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw invalidBody();
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw invalidBody();
  return parsed.data;
}

type RouteContext = { params: Promise<{ id: string }> };

/** Identifiant de ressource dans l'URL : doit être un UUID. */
export async function readId(context: RouteContext): Promise<string> {
  const { id } = await context.params;
  const parsed = idParamSchema.safeParse(id);
  if (!parsed.success) throw new AdminError(404, "Ressource introuvable.");
  return parsed.data;
}

export type { RouteContext };
