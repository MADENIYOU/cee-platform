import { describe, expect, it } from "vitest";
import { parseAuditFilters } from "@/lib/admin/audit/auditFilters";
import { paginate, parsePage, toPage } from "@/lib/admin/pagination";

describe("parseAuditFilters", () => {
  it("lit les filtres de l'URL et borne la période à la journée entière", () => {
    const filters = parseAuditFilters({
      page: "3",
      action: " role. ",
      acteur: "Awa",
      du: "2026-10-01",
      au: "2026-10-05",
    });

    expect(filters).toEqual({
      page: 3,
      action: "role.",
      entity: undefined,
      acteur: "Awa",
      du: new Date("2026-10-01T00:00:00.000Z"),
      au: new Date("2026-10-05T23:59:59.999Z"),
    });
  });

  it("ignore une date ou une page invalide plutôt que d'échouer", () => {
    const filters = parseAuditFilters({ page: "-2", du: "hier", au: "2026-13-45" });

    expect(filters.page).toBe(1);
    expect(filters.du).toBeUndefined();
    expect(filters.au).toBeUndefined();
  });

  it("ne garde que la première valeur d'un paramètre répété", () => {
    expect(parseAuditFilters({ entity: ["user", "annonce"] }).entity).toBe("user");
  });
});

describe("pagination", () => {
  it("retombe sur la page 1 pour toute valeur non numérique", () => {
    expect(parsePage(undefined)).toBe(1);
    expect(parsePage("abc")).toBe(1);
    expect(parsePage("4")).toBe(4);
  });

  it("calcule le nombre de pages, au minimum une", () => {
    expect(toPage([], 0, 1).pageCount).toBe(1);
    expect(toPage([], 51, 1).pageCount).toBe(3);
  });

  it("découpe une liste en mémoire et borne la page demandée", () => {
    const items = Array.from({ length: 60 }, (_, index) => index + 1);

    expect(paginate(items, 1)).toMatchObject({ page: 1, pageCount: 3, total: 60 });
    expect(paginate(items, 3).rows).toEqual([51, 52, 53, 54, 55, 56, 57, 58, 59, 60]);
    expect(paginate(items, 99).page).toBe(3);
    expect(paginate(items, 0).page).toBe(1);
    expect(paginate([], 1)).toEqual({ rows: [], total: 0, page: 1, pageCount: 1 });
  });
});
