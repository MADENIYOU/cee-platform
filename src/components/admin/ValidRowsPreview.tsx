"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { COLUMN_LABELS } from "@/lib/admin/import/columns";
import { paginate } from "@/lib/admin/pagination";
import type { ValidRow } from "@/lib/admin/import/validateRow";

const COLUMNS: Column<ValidRow>[] = [
  { key: "line", header: "Ligne", render: ({ line }) => line },
  { key: "nom", header: COLUMN_LABELS.nom, render: ({ row }) => row.nom },
  { key: "prenom", header: COLUMN_LABELS.prenom, render: ({ row }) => row.prenom },
  { key: "email", header: COLUMN_LABELS.email, render: ({ row }) => row.email },
  { key: "departement", header: COLUMN_LABELS.departement, render: ({ row }) => row.departement },
  { key: "promo", header: COLUMN_LABELS.promo, render: ({ row }) => row.promo },
  { key: "classe", header: COLUMN_LABELS.classe, render: ({ row }) => row.classe },
];

/**
 * Les étudiants qui seront importés, tels qu'ils seront enregistrés
 * (valeurs normalisées). Paginé dans le navigateur : un fichier peut porter
 * des milliers de lignes, on n'en affiche jamais plus d'une page (règle n°6).
 */
export function ValidRowsPreview({ rows }: { rows: readonly ValidRow[] }) {
  const [requestedPage, setRequestedPage] = useState(1);
  if (rows.length === 0) return null;

  const { rows: displayed, page, pageCount, total } = paginate(rows, requestedPage);

  return (
    <div className="mt-4">
      <h3 className="mb-2 font-medium">
        {total} étudiant{total > 1 ? "s" : ""} à importer
      </h3>
      <DataTable
        caption="Étudiants à importer"
        columns={COLUMNS}
        rows={displayed}
        rowKey={({ line }) => String(line)}
        emptyMessage=""
      />
      {pageCount > 1 && (
        <nav
          aria-label="Pagination des étudiants à importer"
          className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm"
        >
          <p aria-live="polite" className="text-[var(--color-muted-foreground)]">
            Page {page} sur {pageCount}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" disabled={page <= 1} onClick={() => setRequestedPage(page - 1)}>
              Précédent
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={page >= pageCount}
              onClick={() => setRequestedPage(page + 1)}
            >
              Suivant
            </Button>
          </div>
        </nav>
      )}
    </div>
  );
}
