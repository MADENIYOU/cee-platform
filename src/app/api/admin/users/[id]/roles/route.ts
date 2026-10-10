import { requireRole } from "@/lib/auth/session";
import { toAdminResponse } from "@/lib/admin/errors";
import { readId, readJson, type RouteContext } from "@/lib/admin/http";
import { updateUserAccess } from "@/lib/admin/roles/updateUserAccess";
import { userAccessSchema } from "@/lib/admin/schemas";

/**
 * Attribue ou retire les droits d'un compte. Strictement réservé à l'Admin
 * (règle n°16) ; chaque changement est tracé par `updateUserAccess`.
 */
export async function PATCH(request: Request, context: RouteContext): Promise<Response> {
  try {
    const session = await requireRole("admin");
    const targetId = await readId(context);
    const input = await readJson(request, userAccessSchema);

    const result = await updateUserAccess(session, targetId, input);
    return Response.json(result);
  } catch (error) {
    return toAdminResponse(error);
  }
}
