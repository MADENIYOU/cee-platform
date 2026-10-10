import { getSession, toHttpResponse, UnauthorizedError } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { uploadFile, UploadValidationError } from "@/lib/upload/uploadFile";
import { logAudit } from "@/lib/audit/logAudit";

/**
 * Route d'upload générique, réutilisable par les autres modules tant
 * qu'ils ne construisent pas leur propre route spécialisée. Protégée :
 * toute personne connectée (étudiant ou droits d'admin) peut uploader,
 * le module appelant reste responsable de ses propres règles métier.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const session = await getSession();
    if (!session) throw new UnauthorizedError();

    const { success, remaining } = await checkRateLimit(`upload:${session.userId}`);
    if (!success) {
      return Response.json(
        { error: "Trop de requêtes, réessayez plus tard" },
        { status: 429, headers: { "X-RateLimit-Remaining": "0" } }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return Response.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    const allowedTypesRaw = formData.get("allowedTypes");
    const allowedTypes =
      typeof allowedTypesRaw === "string" && allowedTypesRaw.length > 0
        ? allowedTypesRaw.split(",")
        : ["application/pdf", "image/*", "video/*"];

    const result = await uploadFile(file, { allowedTypes });

    await logAudit({
      actorId: session.userId,
      actorNomSnapshot: `${session.prenom} ${session.nom}`.trim(),
      action: "fichier.televerse",
      entity: "upload",
      entityId: result.key,
      metadata: { sizeBytes: result.sizeBytes },
    });

    return Response.json(result, {
      status: 201,
      headers: { "X-RateLimit-Remaining": String(remaining) },
    });
  } catch (error) {
    if (error instanceof UploadValidationError) {
      return Response.json({ error: error.message }, { status: 422 });
    }
    return toHttpResponse(error);
  }
}
