import { sendJson, type ApiResult } from "@/lib/admin/apiClient";
import { BATCH_SIZE } from "@/lib/admin/import/columns";
import type { ImportReport, ImportStatus, RejectedLine } from "@/lib/admin/import/report";
import type { ValidRow } from "@/lib/admin/import/validateRow";

export type ImportOutcome = { status: ImportStatus; report: ImportReport };

export function toBatches<T>(items: readonly T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let start = 0; start < items.length; start += size) {
    batches.push(items.slice(start, start + size));
  }
  return batches;
}

/**
 * Envoie les lignes valides par paquets, l'un après l'autre, en signalant
 * la progression. Au premier échec l'import s'arrête : rien n'est mis en
 * file ni rejoué automatiquement (règle n°11). Relancer est sans danger,
 * l'adresse faisant foi côté serveur.
 */
export async function runImport(input: {
  valid: readonly ValidRow[];
  rejected: readonly RejectedLine[];
  onProgress: (sent: number) => void;
}): Promise<ApiResult<ImportOutcome>> {
  const departements = [...new Set(input.valid.map(({ row }) => row.departement))];
  const opened = await sendJson<{ id: string }>("/api/admin/imports", "POST", { departements });
  if (!opened.ok) return opened;

  const base = `/api/admin/imports/${opened.data.id}`;
  let sent = 0;
  for (const batch of toBatches(input.valid, BATCH_SIZE)) {
    const rows = batch.map(({ line, row }) => ({ line, raw: row }));
    const result = await sendJson(`${base}/rows`, "POST", { rows });
    if (!result.ok) return result;
    sent += batch.length;
    input.onProgress(sent);
  }

  return sendJson<ImportOutcome>(`${base}/finalize`, "POST", { rejected: input.rejected });
}
