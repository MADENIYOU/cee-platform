/**
 * Format attendu du fichier d'import de la liste blanche.
 *
 * POINT OUVERT (Module_Administration_Comptes.md §6) : les colonnes exactes
 * et la liste des classes restent à valider avec les structures
 * départementales. Tout est isolé ici pour être ajusté en un seul endroit.
 */
export const IMPORT_COLUMNS = ["nom", "prenom", "email", "departement", "promo", "classe"] as const;

export type ImportColumn = (typeof IMPORT_COLUMNS)[number];

/** Libellé affiché et en-têtes acceptés (comparés sans casse ni accent). */
export const COLUMN_LABELS: Record<ImportColumn, string> = {
  nom: "Nom",
  prenom: "Prénom",
  email: "Email",
  departement: "Département",
  promo: "Promo",
  classe: "Classe",
};

export const COLUMN_ALIASES: Record<ImportColumn, readonly string[]> = {
  nom: ["nom"],
  prenom: ["prenom", "prenoms"],
  email: ["email", "e-mail", "mail", "adresse email", "adresse"],
  departement: ["departement"],
  promo: ["promo", "promotion"],
  classe: ["classe"],
};

/** Les 6 départements académiques (Plateforme_CEE_Fusion.md §3, Brique 3). */
export const DEPARTEMENTS = [
  "Génie Informatique",
  "Génie Mécanique",
  "Génie Chimique et Biologie Appliquée",
  "Génie Électrique",
  "Génie Civil",
  "Gestion",
] as const;

/** Liste provisoire, à remplacer par le référentiel validé. */
export const CLASSES = ["DUT1", "DUT2", "DST1", "DST2", "LP", "DIC1", "DIC2", "DIC3", "M1", "M2"] as const;

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_ROWS = 10_000;
export const BATCH_SIZE = 200;

/** Minuscules, sans accent, espaces réduits : sert à comparer du texte saisi. */
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
