/**
 * Schémas des corps de requête du Module 5 — validation à la frontière du
 * système : rien de ce qui vient du navigateur n'est cru sur parole.
 */
import { z } from "zod";
import { BATCH_SIZE, IMPORT_COLUMNS, MAX_ROWS } from "@/lib/admin/import/columns";
import { rejectedLineSchema } from "@/lib/admin/import/report";
import { ASSIGNABLE_ROLES } from "@/lib/admin/roles/roleRules";

const cell = z.string().max(200);

const rawRowSchema = z.object(
  Object.fromEntries(IMPORT_COLUMNS.map((column) => [column, cell])) as Record<
    (typeof IMPORT_COLUMNS)[number],
    typeof cell
  >
);

export const openImportSchema = z.object({ departement: z.string().min(1).max(100) });

export const importBatchSchema = z.object({
  rows: z
    .array(z.object({ line: z.number().int().positive(), raw: rawRowSchema }))
    .min(1)
    .max(BATCH_SIZE),
});

export const finalizeImportSchema = z.object({
  rejected: z.array(rejectedLineSchema).max(MAX_ROWS),
});

export const userAccessSchema = z.object({
  roles: z.array(z.enum(ASSIGNABLE_ROLES)).max(ASSIGNABLE_ROLES.length),
  isResponsableClasse: z.boolean(),
});

export const newStudentSchema = z.object({
  nom: z.string().max(100),
  prenom: z.string().max(100),
  email: z.string().max(200),
});

export const idParamSchema = z.string().uuid();
