import { requireRole } from "@/lib/auth/session";
import { toAdminResponse } from "@/lib/admin/errors";
import { readId, readJson, type RouteContext } from "@/lib/admin/http";
import { finalizeImport } from "@/lib/admin/import/importService";
import { finalizeImportSchema } from "@/lib/admin/schemas";

/** Clôt un import : statut final et ligne d'audit. Réservé à l'Admin. */
export async function POST(request: Request, context: RouteContext): Promise<Response> {
  try {
    const session = await requireRole("admin");
    const importId = await readId(context);
    const { rejected } = await readJson(request, finalizeImportSchema);

    const result = await finalizeImport(session, importId, rejected);
    return Response.json(result);
  } catch (error) {
    return toAdminResponse(error);
  }
}
