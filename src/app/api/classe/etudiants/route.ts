import { toAdminResponse } from "@/lib/admin/errors";
import { requireResponsableClasse } from "@/lib/admin/guards";
import { readJson } from "@/lib/admin/http";
import { newStudentSchema } from "@/lib/admin/schemas";
import { addStudentToOwnClass } from "@/lib/admin/users/addStudentToClass";

/**
 * Ajout d'un étudiant manquant par un responsable de classe. La classe
 * n'est pas lue dans la requête : elle vient de la session.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const session = await requireResponsableClasse();
    const input = await readJson(request, newStudentSchema);

    const created = await addStudentToOwnClass(session, input);
    return Response.json(created, { status: 201 });
  } catch (error) {
    return toAdminResponse(error);
  }
}
