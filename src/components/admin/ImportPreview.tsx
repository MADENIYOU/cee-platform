"use client";

import { Button } from "@/components/ui/button";
import { Notice } from "@/components/admin/Notice";
import { RejectedLines } from "@/components/admin/RejectedLines";
import { ValidRowsPreview } from "@/components/admin/ValidRowsPreview";
import type { Preview } from "@/components/admin/useImportWizard";

/** Aperçu avant validation : rien n'est encore envoyé au serveur. */
export function ImportPreview({
  preview,
  error,
  onConfirm,
  onCancel,
}: {
  preview: Preview;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const validCount = preview.valid.length;
  const rejectedCount = preview.rejected.length;

  return (
    <section aria-labelledby="apercu-titre">
      <h2 id="apercu-titre" className="text-lg font-semibold">
        Aperçu de « {preview.fileName} »
      </h2>

      {error && (
        <Notice tone="error" className="mt-3">
          {error} Aucune ligne n&apos;a été mise en attente : relancez l&apos;import quand vous le souhaitez.
        </Notice>
      )}

      <Notice tone={rejectedCount > 0 ? "info" : "success"} className="mt-3">
        {validCount} ligne{validCount > 1 ? "s" : ""} prête{validCount > 1 ? "s" : ""} à être importée
        {validCount > 1 ? "s" : ""}
        {rejectedCount > 0 && ` — ${rejectedCount} écartée${rejectedCount > 1 ? "s" : ""}, les autres passent`}.
      </Notice>

      <ValidRowsPreview rows={preview.valid} />

      <RejectedLines
        lines={preview.rejected.map(({ line, errors, raw }) => ({ line, errors, label: raw.email || undefined }))}
      />

      <div className="mt-6 flex flex-wrap gap-3">
        <Button type="button" disabled={validCount === 0} onClick={onConfirm}>
          Valider l&apos;import
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Choisir un autre fichier
        </Button>
      </div>

      {validCount === 0 && (
        <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
          Aucune ligne valide : corrigez le fichier puis réessayez.
        </p>
      )}
    </section>
  );
}
