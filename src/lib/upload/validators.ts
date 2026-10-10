import "server-only";
import { fileTypeFromBuffer } from "file-type";

/**
 * Tailles max par défaut (valeurs proposées en attendant une validation
 * formelle — voir Module_Fondations_Identite.md §7).
 */
export const DEFAULT_MAX_SIZE_BYTES: Record<string, number> = {
  "application/pdf": 5 * 1024 * 1024, // 5 Mo
  image: 10 * 1024 * 1024, // 10 Mo
  video: 50 * 1024 * 1024, // 50 Mo
};

/**
 * Archives explicitement interdites : c'est le garde-fou qui ferme la
 * classe de vulnérabilité "zip bomb" sans écrire de logique de
 * décompression — on n'accepte simplement aucun format archive/compressé.
 */
const FORBIDDEN_MIME_PREFIXES = [
  "application/zip",
  "application/x-7z-compressed",
  "application/x-rar-compressed",
  "application/x-tar",
  "application/gzip",
  "application/x-bzip2",
];

export type ValidationResult =
  | { valid: true; mimeType: string }
  | { valid: false; reason: string };

/**
 * Valide un fichier à partir de ses OCTETS RÉELS (pas du `Content-Type`
 * déclaré par le client, qui est trivialement falsifiable).
 */
export async function validateUploadedFile(
  buffer: Buffer,
  options: { allowedTypes: string[]; maxSizeBytes?: Record<string, number> }
): Promise<ValidationResult> {
  const maxSizes = options.maxSizeBytes ?? DEFAULT_MAX_SIZE_BYTES;

  // Coercion explicite en Uint8Array "plain" : un Buffer Node passé
  // depuis un autre realm (ex. environnement de test jsdom) peut échouer
  // le contrôle `instanceof Uint8Array` strict de `file-type`.
  const sniffed = await fileTypeFromBuffer(new Uint8Array(buffer));
  if (!sniffed) {
    return { valid: false, reason: "Type de fichier non reconnu" };
  }

  if (FORBIDDEN_MIME_PREFIXES.some((prefix) => sniffed.mime.startsWith(prefix))) {
    return { valid: false, reason: "Les archives ne sont pas acceptées" };
  }

  const isAllowed = options.allowedTypes.some((allowed) => {
    if (allowed.endsWith("/*")) {
      return sniffed.mime.startsWith(allowed.replace("/*", "/"));
    }
    return sniffed.mime === allowed;
  });

  if (!isAllowed) {
    return { valid: false, reason: `Type "${sniffed.mime}" non autorisé ici` };
  }

  const category = sniffed.mime.split("/")[0] ?? sniffed.mime;
  const maxForCategory = maxSizes[sniffed.mime] ?? maxSizes[category] ?? maxSizes.image ?? 0;

  if (buffer.byteLength > maxForCategory) {
    return {
      valid: false,
      reason: `Fichier trop volumineux (max ${Math.round(maxForCategory / 1024 / 1024)} Mo pour ${category})`,
    };
  }

  return { valid: true, mimeType: sniffed.mime };
}
