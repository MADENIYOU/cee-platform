import { describe, expect, it } from "vitest";
import { hasActiveFilter, parseUserFilters } from "@/lib/admin/users/userFilters";

describe("parseUserFilters", () => {
  it("lit la recherche, le département et la classe depuis l'URL", () => {
    expect(
      parseUserFilters({ q: " diop ", departement: "Génie Civil", classe: "DUT2", page: "2" })
    ).toEqual({ page: 2, q: "diop", departement: "Génie Civil", classe: "DUT2" });
  });

  it("traite « tous » (valeur vide) comme une absence de filtre", () => {
    const filters = parseUserFilters({ q: "", departement: "", classe: "" });

    expect(filters).toEqual({ page: 1, q: undefined, departement: undefined, classe: undefined });
    expect(hasActiveFilter(filters)).toBe(false);
  });

  it("signale un filtre actif dès qu'un seul critère est renseigné", () => {
    expect(hasActiveFilter(parseUserFilters({ classe: "DIC1" }))).toBe(true);
  });
});
