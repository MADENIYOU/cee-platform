import { DataTable, type Column } from "@/components/admin/DataTable";
import { COLUMN_LABELS } from "@/lib/admin/import/columns";
import type { ValidRow } from "@/lib/admin/import/validateRow";

/** Un fichier peut porter des milliers de lignes : on n'en affiche qu'un extrait. */
export const MAX_PREVIEWED_ROWS = 50;

const COLUMNS: Column<ValidRow>[] = [
  { key: "line", header: "Ligne", render: ({ line }) => line },
  { key: "nom", header: COLUMN_LABELS.nom, render: ({ row }) => row.nom },
  { key: "prenom", header: COLUMN_LABELS.prenom, render: ({ row }) => row.prenom },
  { key: "email", header: COLUMN_LABELS.email, render: ({ row }) => row.email },
  { key: "departement", header: COLUMN_LABELS.departement, render: ({ row }) => row.departement },
  { key: "promo", header: COLUMN_LABELS.promo, render: ({ row }) => row.promo },
  { key: "classe", header: COLUMN_LABELS.classe, render: ({ row }) => row.classe },
];

/** Les étudiants qui seront importés, tels qu'ils seront enregistrés (valeurs normalisées). */
export function ValidRowsPreview({ rows }: { rows: readonly ValidRow[] }) {
  if (rows.length === 0) return null;
  const displayed = rows.slice(0, MAX_PREVIEWED_ROWS);
  const hidden = rows.length - displayed.length;

  return (
    <div className="mt-4">
      <h3 className="mb-2 font-medium">
        {rows.length} étudiant{rows.length > 1 ? "s" : ""} à importer
      </h3>
      <DataTable
        caption="Étudiants à importer"
        columns={COLUMNS}
        rows={displayed}
        rowKey={({ line }) => String(line)}
        emptyMessage=""
      />
      {hidden > 0 && (
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
          Extrait des {displayed.length} premières lignes. Les {hidden} suivantes seront importées aussi.
        </p>
      )}
    </div>
  );
}
