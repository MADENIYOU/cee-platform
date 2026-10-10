"use client";

import { useCallback, useState } from "react";
import { describeSheetError, mapSheet } from "@/lib/admin/import/mapSheet";
import { readWorkbook } from "@/lib/admin/import/readWorkbook";
import { runImport, type ImportOutcome } from "@/lib/admin/import/runImport";
import { validateRows, type RejectedRow, type ValidRow } from "@/lib/admin/import/validateRow";

export type Preview = { fileName: string; valid: ValidRow[]; rejected: RejectedRow[] };

/**
 * États de l'écran d'import. « preview » avec des lignes écartées est le
 * « succès partiel » de la règle n°1, distinct des 4 états classiques.
 */
export type WizardState =
  | { step: "idle"; error?: string }
  | { step: "reading" }
  | { step: "preview"; preview: Preview; error?: string }
  | { step: "importing"; preview: Preview; sent: number }
  | { step: "done"; outcome: ImportOutcome };

export function useImportWizard() {
  const [state, setState] = useState<WizardState>({ step: "idle" });

  const selectFile = useCallback(async (file: File) => {
    setState({ step: "reading" });
    const workbook = await readWorkbook(file);
    if (!workbook.ok) return setState({ step: "idle", error: workbook.error });

    const mapping = mapSheet(workbook.sheet);
    if (!mapping.ok) return setState({ step: "idle", error: describeSheetError(mapping) });

    setState({ step: "preview", preview: { fileName: file.name, ...validateRows(mapping.rows) } });
  }, []);

  const confirm = useCallback(async (preview: Preview, departement: string) => {
    setState({ step: "importing", preview, sent: 0 });
    const result = await runImport({
      departement,
      valid: preview.valid,
      rejected: preview.rejected.map(({ line, errors }) => ({ line, errors })),
      onProgress: (sent) => setState({ step: "importing", preview, sent }),
    });
    // En cas d'échec on revient à l'aperçu : la relance est manuelle.
    setState(result.ok ? { step: "done", outcome: result.data } : { step: "preview", preview, error: result.error });
  }, []);

  const reset = useCallback(() => setState({ step: "idle" }), []);

  return { state, selectFile, confirm, reset };
}
