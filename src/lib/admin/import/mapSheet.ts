/**
 * Transforme la feuille brute (matrice de cellules) en lignes nommées.
 * Pure : testable sans fichier Excel.
 */
import {
  COLUMN_ALIASES,
  COLUMN_LABELS,
  IMPORT_COLUMNS,
  MAX_ROWS,
  normalizeText,
  type ImportColumn,
} from "@/lib/admin/import/columns";
import type { NumberedRow, RawRow } from "@/lib/admin/import/validateRow";

export type SheetCell = string | number | boolean | Date | null | undefined;

export type SheetMapping =
  | { ok: true; rows: NumberedRow[] }
  | { ok: false; code: "FICHIER_VIDE" }
  | { ok: false; code: "COLONNES_MANQUANTES"; missing: string[] }
  | { ok: false; code: "TROP_DE_LIGNES"; max: number };

function cellToText(cell: SheetCell): string {
  if (cell === null || cell === undefined) return "";
  if (cell instanceof Date) return String(cell.getFullYear());
  return String(cell).trim();
}

function locateColumns(header: readonly SheetCell[]): Map<ImportColumn, number> {
  const titles = header.map((cell) => normalizeText(cellToText(cell)));
  const positions = new Map<ImportColumn, number>();
  for (const column of IMPORT_COLUMNS) {
    const index = titles.findIndex((title) => COLUMN_ALIASES[column].includes(title));
    if (index >= 0) positions.set(column, index);
  }
  return positions;
}

export function mapSheet(sheet: readonly (readonly SheetCell[])[]): SheetMapping {
  const [header, ...body] = sheet;
  if (!header) return { ok: false, code: "FICHIER_VIDE" };

  const positions = locateColumns(header);
  const missing = IMPORT_COLUMNS.filter((column) => !positions.has(column));
  if (missing.length > 0) {
    return { ok: false, code: "COLONNES_MANQUANTES", missing: missing.map((c) => COLUMN_LABELS[c]) };
  }

  const rows: NumberedRow[] = [];
  body.forEach((cells, index) => {
    const raw = Object.fromEntries(
      IMPORT_COLUMNS.map((column) => [column, cellToText(cells[positions.get(column) ?? -1])])
    ) as RawRow;
    const isBlank = IMPORT_COLUMNS.every((column) => raw[column] === "");
    // Ligne 1 = en-têtes : la première ligne de données porte le numéro 2,
    // comme dans le tableur de la personne qui corrige le fichier.
    if (!isBlank) rows.push({ line: index + 2, raw });
  });

  if (rows.length === 0) return { ok: false, code: "FICHIER_VIDE" };
  if (rows.length > MAX_ROWS) return { ok: false, code: "TROP_DE_LIGNES", max: MAX_ROWS };
  return { ok: true, rows };
}

export function describeSheetError(mapping: Exclude<SheetMapping, { ok: true }>): string {
  switch (mapping.code) {
    case "FICHIER_VIDE":
      return "Le fichier ne contient aucune ligne d'étudiant.";
    case "COLONNES_MANQUANTES":
      return `Colonnes manquantes : ${mapping.missing.join(", ")}.`;
    case "TROP_DE_LIGNES":
      return `Le fichier dépasse ${mapping.max} lignes. Découpez-le par département.`;
  }
}
