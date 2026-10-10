import { requireRole } from "@/lib/auth/session";
import { toAdminResponse } from "@/lib/admin/errors";
import { readId, readJson, type RouteContext } from "@/lib/admin/http";
import { processImportBatch } from "@/lib/admin/import/importService";
import { importBatchSchema } from "@/lib/admin/schemas";

/**
 * Traite un paquet de lignes d'un import ouvert. Réservé à l'Admin.
 * Le découpage en paquets garde chaque requête courte (règle n°5) et permet
 * le suivi de progression côté écran.
 */
export async function POST(request: Request, context: RouteContext): Promise<Response> {
  try {
    const session = await requireRole("admin");
    const importId = await readId(context);
    const { rows } = await readJson(request, importBatchSchema);

    const result = await processImportBatch(session, importId, rows);
    return Response.json(result);
  } catch (error) {
    return toAdminResponse(error);
  }
}
