import { firstParam, parsePage, type SearchParams } from "@/lib/admin/pagination";

export type UserFilters = {
  page: number;
  /** Recherche libre sur nom, prénom et email. */
  q?: string;
  departement?: string;
  classe?: string;
};

/** Les filtres viennent de l'URL : une valeur vide ou absente n'en est pas un. */
export function parseUserFilters(params: SearchParams): UserFilters {
  return {
    page: parsePage(firstParam(params, "page")),
    q: firstParam(params, "q"),
    departement: firstParam(params, "departement"),
    classe: firstParam(params, "classe"),
  };
}

export function hasActiveFilter(filters: UserFilters): boolean {
  return !!(filters.q || filters.departement || filters.classe);
}
