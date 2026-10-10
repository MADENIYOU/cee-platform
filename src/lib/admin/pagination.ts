/** Pagination côté serveur (règle d'ingénierie n°6) : jamais tout charger. */
export const PAGE_SIZE = 25;

export type Page<T> = { rows: T[]; total: number; page: number; pageCount: number };

/** Lit `?page=` : toute valeur invalide retombe sur la première page. */
export function parsePage(value: string | undefined): number {
  const page = Number.parseInt(value ?? "", 10);
  return Number.isFinite(page) && page >= 1 ? page : 1;
}

export function toPage<T>(rows: T[], total: number, page: number): Page<T> {
  return { rows, total, page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export function pageOffset(page: number): { skip: number; take: number } {
  return { skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE };
}

/**
 * Pagination d'une liste déjà en mémoire (aperçu d'import, dans le
 * navigateur). Une page hors bornes est ramenée à la plus proche.
 */
export function paginate<T>(items: readonly T[], page: number, size = PAGE_SIZE): Page<T> {
  const pageCount = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(Math.max(1, page), pageCount);
  return {
    rows: items.slice((current - 1) * size, current * size),
    total: items.length,
    page: current,
    pageCount,
  };
}

export type SearchParams = Record<string, string | string[] | undefined>;

/** Première valeur d'un paramètre d'URL, nettoyée. */
export function firstParam(params: SearchParams, key: string): string | undefined {
  const value = params[key];
  const first = Array.isArray(value) ? value[0] : value;
  return first?.trim() || undefined;
}
