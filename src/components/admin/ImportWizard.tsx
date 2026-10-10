"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ImportOutcomeSummary } from "@/components/admin/ImportOutcomeSummary";
import { ImportPreview } from "@/components/admin/ImportPreview";
import { Notice } from "@/components/admin/Notice";
import { labelClass } from "@/components/admin/formStyles";
import { useImportWizard } from "@/components/admin/useImportWizard";
import { COLUMN_LABELS, IMPORT_COLUMNS } from "@/lib/admin/import/columns";

const EXPECTED_COLUMNS = IMPORT_COLUMNS.map((column) => COLUMN_LABELS[column]).join(", ");

/** Parcours d'import : fichier → aperçu des erreurs → validation → bilan. */
export function ImportWizard() {
  const router = useRouter();
  const { state, selectFile, confirm, reset } = useImportWizard();

  if (state.step === "reading") {
    return <Notice>Lecture du fichier en cours…</Notice>;
  }

  if (state.step === "preview") {
    return (
      <ImportPreview
        preview={state.preview}
        error={state.error}
        onConfirm={() => confirm(state.preview)}
        onCancel={reset}
      />
    );
  }

  if (state.step === "importing") {
    const total = state.preview.valid.length;
    return (
      <div role="status">
        <label htmlFor="progression" className={labelClass}>
          Import en cours : {state.sent} / {total} lignes
        </label>
        <progress id="progression" max={total} value={state.sent} className="w-full" />
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">Gardez cette page ouverte.</p>
      </div>
    );
  }

  if (state.step === "done") {
    return (
      <div>
        <ImportOutcomeSummary status={state.outcome.status} report={state.outcome.report} />
        <Button
          className="mt-6"
          onClick={() => {
            reset();
            router.refresh();
          }}
        >
          Importer un autre fichier
        </Button>
      </div>
    );
  }

  return (
    <div>
      {state.error && (
        <Notice tone="error" className="mb-4">
          {state.error}
        </Notice>
      )}
      <label htmlFor="fichier" className={labelClass}>
        Fichier Excel (.xlsx) de la structure départementale
      </label>
      <input
        id="fichier"
        type="file"
        accept=".xlsx"
        aria-describedby="fichier-aide"
        className="block w-full text-sm file:mr-3 file:h-10 file:rounded-md file:border file:border-[var(--color-border)] file:bg-[var(--color-muted)] file:px-4"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void selectFile(file);
        }}
      />
      <p id="fichier-aide" className="mt-2 text-sm text-[var(--color-muted-foreground)]">
        Colonnes attendues sur la première ligne : {EXPECTED_COLUMNS}. Rien n&apos;est envoyé avant votre
        validation.
      </p>
    </div>
  );
}
