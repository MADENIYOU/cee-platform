/**
 * Validation d'une ligne d'import — pure et isomorphe : le même code tourne
 * dans le navigateur (aperçu avant envoi, règle n°8) et sur le serveur, qui
 * revalide toujours (on ne fait jamais confiance au client).
 */
import { isAllowedEmailDomain } from "@/lib/auth/domains";
import { CLASSES, DEPARTEMENTS, normalizeText, type ImportColumn } from "@/lib/admin/import/columns";
import type { RowErrorCode } from "@/lib/admin/import/rowErrors";

export type RawRow = Record<ImportColumn, string>;

export type ImportRow = {
  nom: string;
  prenom: string;
  email: string;
  departement: string;
  promo: string;
  classe: string;
};

export type RowValidation =
  | { ok: true; row: ImportRow }
  | { ok: false; errors: RowErrorCode[] };

export type NumberedRow = { line: number; raw: RawRow };
export type ValidRow = { line: number; row: ImportRow };
export type RejectedRow = { line: number; raw: RawRow; errors: RowErrorCode[] };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PROMO_PATTERN = /^\d{4}$/;

function findCanonical(list: readonly string[], value: string): string | undefined {
  const wanted = normalizeText(value);
  return list.find((item) => normalizeText(item) === wanted);
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/** Erreurs d'identité, communes à l'import et à l'ajout par le responsable de classe. */
export function validateIdentity(input: { nom: string; prenom: string; email: string }): RowErrorCode[] {
  const errors: RowErrorCode[] = [];
  if (!input.nom.trim()) errors.push("NOM_MANQUANT");
  if (!input.prenom.trim()) errors.push("PRENOM_MANQUANT");

  const email = normalizeEmail(input.email);
  if (!EMAIL_PATTERN.test(email)) errors.push("ADRESSE_INVALIDE");
  else if (!isAllowedEmailDomain(email)) errors.push("DOMAINE_REFUSE");
  return errors;
}

export function validateRow(raw: RawRow): RowValidation {
  const errors = validateIdentity(raw);

  const departement = findCanonical(DEPARTEMENTS, raw.departement);
  if (!departement) errors.push("DEPARTEMENT_INCONNU");

  const classe = findCanonical(CLASSES, raw.classe);
  if (!classe) errors.push("CLASSE_INCONNUE");

  const promo = raw.promo.trim();
  if (!PROMO_PATTERN.test(promo)) errors.push("PROMO_INVALIDE");

  if (errors.length > 0 || !departement || !classe) return { ok: false, errors };

  return {
    ok: true,
    row: {
      nom: raw.nom.trim(),
      prenom: raw.prenom.trim(),
      email: normalizeEmail(raw.email),
      departement,
      promo,
      classe,
    },
  };
}

/**
 * Valide un ensemble de lignes. L'adresse est la clé : une adresse déjà vue
 * plus haut est rejetée en doublon, la première occurrence valide fait foi.
 */
export function validateRows(rows: readonly NumberedRow[]): {
  valid: ValidRow[];
  rejected: RejectedRow[];
} {
  const seen = new Set<string>();
  const valid: ValidRow[] = [];
  const rejected: RejectedRow[] = [];

  for (const { line, raw } of rows) {
    const result = validateRow(raw);
    if (!result.ok) {
      rejected.push({ line, raw, errors: result.errors });
      continue;
    }
    if (seen.has(result.row.email)) {
      rejected.push({ line, raw, errors: ["DOUBLON_FICHIER"] });
      continue;
    }
    seen.add(result.row.email);
    valid.push({ line, row: result.row });
  }

  return { valid, rejected };
}
