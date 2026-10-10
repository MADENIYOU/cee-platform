import type { ReactNode } from "react";

export type Column<Row> = {
  key: string;
  header: string;
  render: (row: Row) => ReactNode;
};

/**
 * Table d'administration réutilisable (journal d'audit, comptes, rôles,
 * suivi des imports). Rendue côté serveur : lisible sans JavaScript.
 * L'état « vide » est porté ici ; chargement et erreur le sont par les
 * fichiers `loading.tsx` / `error.tsx` de la route.
 */
export function DataTable<Row>({
  caption,
  columns,
  rows,
  rowKey,
  emptyMessage,
}: {
  caption: string;
  columns: readonly Column<Row>[];
  rows: readonly Row[];
  rowKey: (row: Row) => string;
  emptyMessage: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-[var(--color-border)] p-6 text-center text-[var(--color-muted-foreground)]">
        {emptyMessage}
      </p>
    );
  }

  return (
    // Sur petit écran la table défile horizontalement : la zone doit être
    // atteignable au clavier (WCAG 2.1.1).
    <div
      role="region"
      aria-label={caption}
      tabIndex={0}
      className="overflow-x-auto rounded-md border border-[var(--color-border)]"
    >
      <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-[var(--color-muted)]">
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className="px-3 py-2 font-medium">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-t border-[var(--color-border)] align-top">
              {columns.map((column) => (
                <td key={column.key} className="px-3 py-2">
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
