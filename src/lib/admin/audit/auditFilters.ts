import { firstParam, parsePage, type SearchParams } from "@/lib/admin/pagination";

export type AuditFilters = {
  page: number;
  action?: string;
  entity?: string;
  acteur?: string;
  du?: Date;
  au?: Date;
};

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseDay(value: string | undefined, endOfDay: boolean): Date | undefined {
  if (!value || !DAY_PATTERN.test(value)) return undefined;
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** Les filtres viennent de l'URL : tout ce qui est invalide est ignoré. */
export function parseAuditFilters(params: SearchParams): AuditFilters {
  return {
    page: parsePage(firstParam(params, "page")),
    action: firstParam(params, "action"),
    entity: firstParam(params, "entity"),
    acteur: firstParam(params, "acteur"),
    du: parseDay(firstParam(params, "du"), false),
    au: parseDay(firstParam(params, "au"), true),
  };
}
