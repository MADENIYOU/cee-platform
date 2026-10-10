"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/admin/Notice";
import { RejectedLines } from "@/components/admin/RejectedLines";
import { fieldClass, labelClass } from "@/components/admin/formStyles";
import type { Preview } from "@/components/admin/useImportWizard";
import { DEPARTEMENTS } from "@/lib/admin/import/columns";

/** Aperçu avant validation : rien n'est encore envoyé au serveur. */
export function ImportPreview({
  preview,
  error,
  onConfirm,
  onCancel,
}: {
  preview: Preview;
  error?: string;
  onConfirm: (departement: string) => void;
  onCancel: () => void;
}) {
  const [departement, setDepartement] = useState("");
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

      <RejectedLines
        lines={preview.rejected.map(({ line, errors, raw }) => ({ line, errors, label: raw.email || undefined }))}
      />

      <form
        className="mt-6 flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (departement && validCount > 0) onConfirm(departement);
        }}
      >
        <div className="min-w-56 flex-1">
          <label htmlFor="departement" className={labelClass}>
            Structure départementale à l&apos;origine du fichier
          </label>
          <select
            id="departement"
            required
            value={departement}
            onChange={(event) => setDepartement(event.target.value)}
            className={fieldClass}
          >
            <option value="">Choisir un département</option>
            {DEPARTEMENTS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={validCount === 0}>
          Valider l&apos;import
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Choisir un autre fichier
        </Button>
      </form>

      {validCount === 0 && (
        <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
          Aucune ligne valide : corrigez le fichier puis réessayez.
        </p>
      )}
    </section>
  );
}
