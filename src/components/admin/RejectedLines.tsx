import { describeRowError, type RowErrorCode } from "@/lib/admin/import/rowErrors";

const MAX_DISPLAYED = 100;

/** Lignes écartées, avec la raison exacte de chacune (règle n°9). */
export function RejectedLines({
  lines,
  total = lines.length,
}: {
  lines: readonly { line: number; errors: readonly RowErrorCode[]; label?: string }[];
  total?: number;
}) {
  if (total === 0) return null;
  const displayed = lines.slice(0, MAX_DISPLAYED);

  return (
    <div className="mt-4">
      <h3 className="font-medium">
        {total} ligne{total > 1 ? "s" : ""} écartée{total > 1 ? "s" : ""}
      </h3>
      <ul className="mt-2 max-h-80 space-y-1 overflow-y-auto rounded-md border border-[var(--color-border)] p-3 text-sm">
        {displayed.map((entry) => (
          <li key={entry.line}>
            <span className="font-medium">Ligne {entry.line}</span>
            {entry.label && <span className="text-[var(--color-muted-foreground)]"> ({entry.label})</span>} :{" "}
            {entry.errors.map(describeRowError).join(" ")}
          </li>
        ))}
      </ul>
      {total > displayed.length && (
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
          Seules les {displayed.length} premières lignes sont affichées.
        </p>
      )}
    </div>
  );
}
