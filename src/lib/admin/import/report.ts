/**
 * Bilan d'un import, stocké en JSON dans `core.whitelist_imports.errors`.
 * Fonctions pures : chaque mise à jour renvoie un nouveau bilan.
 */
import { z } from "zod";
import { ROW_ERROR_CODES, type RowErrorCode } from "@/lib/admin/import/rowErrors";

export type RejectedLine = { line: number; errors: RowErrorCode[] };

export type ImportReport = {
  created: number;
  updated: number;
  rejectedCount: number;
  /** Détail plafonné : le compteur ci-dessus reste exact au-delà. */
  rejected: RejectedLine[];
};

export type ImportStatus = "pending" | "success" | "partial" | "failed";

export const MAX_STORED_REJECTIONS = 500;

export const EMPTY_REPORT: ImportReport = { created: 0, updated: 0, rejectedCount: 0, rejected: [] };

export const rejectedLineSchema = z.object({
  line: z.number().int().positive(),
  errors: z.array(z.enum(ROW_ERROR_CODES as [RowErrorCode, ...RowErrorCode[]])).min(1),
});

const reportSchema = z.object({
  created: z.number().int().nonnegative(),
  updated: z.number().int().nonnegative(),
  rejectedCount: z.number().int().nonnegative(),
  rejected: z.array(rejectedLineSchema),
});

/** Relit le JSON stocké ; un contenu inattendu redevient un bilan vide. */
export function parseReport(stored: unknown): ImportReport {
  const parsed = reportSchema.safeParse(stored);
  return parsed.success ? parsed.data : EMPTY_REPORT;
}

export function addToReport(
  report: ImportReport,
  delta: { created?: number; updated?: number; rejected?: readonly RejectedLine[] }
): ImportReport {
  const rejected = delta.rejected ?? [];
  return {
    created: report.created + (delta.created ?? 0),
    updated: report.updated + (delta.updated ?? 0),
    rejectedCount: report.rejectedCount + rejected.length,
    rejected: [...report.rejected, ...rejected]
      .sort((a, b) => a.line - b.line)
      .slice(0, MAX_STORED_REJECTIONS),
  };
}

/** « partial » = le cas spécial « succès partiel » de la règle n°1. */
export function computeStatus(report: ImportReport): Exclude<ImportStatus, "pending"> {
  const accepted = report.created + report.updated;
  if (accepted === 0) return "failed";
  return report.rejectedCount > 0 ? "partial" : "success";
}
