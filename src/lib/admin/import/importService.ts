import "server-only";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/logAudit";
import { AdminError } from "@/lib/admin/errors";
import { actorSnapshot } from "@/lib/admin/guards";
import {
  EMPTY_REPORT,
  addToReport,
  computeStatus,
  parseReport,
  type ImportReport,
  type ImportStatus,
  type RejectedLine,
} from "@/lib/admin/import/report";
import { validateRows, type NumberedRow } from "@/lib/admin/import/validateRow";
import { upsertWhitelistedStudents } from "@/lib/admin/users/whitelistStore";
import type { AppSession } from "@/types/session";

const PENDING: ImportStatus = "pending";

/**
 * Ouvre un lot d'import. Les départements viennent du fichier lui-même :
 * ils ne servent qu'à étiqueter le lot dans le suivi des imports.
 */
export async function openImport(
  session: AppSession,
  departements: readonly string[]
): Promise<{ id: string }> {
  const created = await prisma.whitelistImport.create({
    data: {
      batchSource: `departement:${[...new Set(departements)].sort().join(", ")}`,
      importedBy: session.userId,
      status: PENDING,
      errors: EMPTY_REPORT,
    },
    select: { id: true },
  });
  return created;
}

/** Un lot n'accepte des lignes que de la personne qui l'a ouvert, et tant qu'il est en cours. */
async function loadOpenImport(session: AppSession, importId: string) {
  const record = await prisma.whitelistImport.findUnique({ where: { id: importId } });
  if (!record) throw new AdminError(404, "Import introuvable.");
  if (record.importedBy !== session.userId || record.status !== PENDING) {
    throw new AdminError(409, "Cet import est déjà clôturé.");
  }
  return record;
}

/**
 * Traite un paquet de lignes. Le serveur REVALIDE chaque ligne, même si le
 * navigateur l'a déjà fait : seules les lignes valides sont écrites.
 */
export async function processImportBatch(
  session: AppSession,
  importId: string,
  rows: readonly NumberedRow[]
): Promise<{ created: number; updated: number; rejected: RejectedLine[] }> {
  const record = await loadOpenImport(session, importId);

  const { valid, rejected } = validateRows(rows);
  const summary = await upsertWhitelistedStudents(valid.map((entry) => entry.row));
  const rejectedLines = rejected.map(({ line, errors }) => ({ line, errors }));

  await prisma.whitelistImport.update({
    where: { id: importId },
    data: { errors: addToReport(parseReport(record.errors), { ...summary, rejected: rejectedLines }) },
  });

  return { ...summary, rejected: rejectedLines };
}

/**
 * Clôt l'import : statut final, lignes écartées dès l'aperçu, et ligne
 * d'audit. Rien n'est rejoué automatiquement après cette étape (règle n°11).
 */
export async function finalizeImport(
  session: AppSession,
  importId: string,
  previewRejected: readonly RejectedLine[]
): Promise<{ status: ImportStatus; report: ImportReport }> {
  const record = await loadOpenImport(session, importId);

  const report = addToReport(parseReport(record.errors), { rejected: previewRejected });
  const status = computeStatus(report);

  await prisma.whitelistImport.update({
    where: { id: importId },
    data: { status, errors: report },
  });

  await logAudit({
    actorId: session.userId,
    actorNomSnapshot: actorSnapshot(session),
    action: "import.valide",
    entity: "whitelist_import",
    entityId: importId,
    metadata: {
      source: record.batchSource,
      status,
      created: report.created,
      updated: report.updated,
      rejected: report.rejectedCount,
    },
  });

  return { status, report };
}

export async function listRecentImports(limit = 10) {
  const records = await prisma.whitelistImport.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return records.map((record) => ({
    id: record.id,
    batchSource: record.batchSource,
    status: record.status as ImportStatus,
    createdAt: record.createdAt,
    report: parseReport(record.errors),
  }));
}
