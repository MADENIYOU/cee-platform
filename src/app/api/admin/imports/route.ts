import { requireRole } from "@/lib/auth/session";
import { toAdminResponse } from "@/lib/admin/errors";
import { readJson } from "@/lib/admin/http";
import { openImport } from "@/lib/admin/import/importService";
import { openImportSchema } from "@/lib/admin/schemas";

/** Ouvre un lot d'import de liste blanche. Réservé à l'Admin. */
export async function POST(request: Request): Promise<Response> {
  try {
    const session = await requireRole("admin");
    const { departements } = await readJson(request, openImportSchema);

    const created = await openImport(session, departements);
    return Response.json(created, { status: 201 });
  } catch (error) {
    return toAdminResponse(error);
  }
}
