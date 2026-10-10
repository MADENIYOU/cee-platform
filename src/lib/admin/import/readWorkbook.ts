import { MAX_FILE_BYTES } from "@/lib/admin/import/columns";
import type { SheetCell } from "@/lib/admin/import/mapSheet";
import type { WorkerReply } from "@/lib/admin/import/parse.worker";

export type WorkbookResult = { ok: true; sheet: SheetCell[][] } | { ok: false; error: string };

const MAX_MEGABYTES = MAX_FILE_BYTES / (1024 * 1024);
const UNREADABLE = "Ce fichier est illisible. Enregistrez-le au format Excel (.xlsx) puis réessayez.";

/** Vérifications locales avant toute lecture (règle n°8). */
export function checkFile(file: { name: string; size: number }): string | null {
  if (!file.name.toLowerCase().endsWith(".xlsx")) return "Choisissez un fichier Excel au format .xlsx.";
  if (file.size === 0) return "Ce fichier est vide.";
  if (file.size > MAX_FILE_BYTES) return `Le fichier dépasse ${MAX_MEGABYTES} Mo.`;
  return null;
}

/** Lit la première feuille du classeur dans un Web Worker. */
export async function readWorkbook(file: File): Promise<WorkbookResult> {
  const refusal = checkFile(file);
  if (refusal) return { ok: false, error: refusal };

  const worker = new Worker(new URL("./parse.worker.ts", import.meta.url));
  try {
    const buffer = await file.arrayBuffer();
    const reply = await new Promise<WorkerReply>((resolve) => {
      worker.addEventListener("message", (event: MessageEvent<WorkerReply>) => resolve(event.data));
      worker.addEventListener("error", () => resolve({ ok: false }));
      worker.postMessage(buffer, [buffer]);
    });
    return reply.ok ? { ok: true, sheet: reply.sheet as SheetCell[][] } : { ok: false, error: UNREADABLE };
  } catch {
    return { ok: false, error: UNREADABLE };
  } finally {
    worker.terminate();
  }
}
