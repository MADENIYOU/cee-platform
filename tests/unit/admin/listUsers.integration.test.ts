import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { listUserFacets, listUsers } from "@/lib/admin/users/listUsers";
import { cleanup, createSessionUser, hasDatabase } from "./helpers/db";

const PREFIX = "m5filtres";

describe.skipIf(!hasDatabase)("filtres des comptes", () => {
  beforeAll(async () => {
    await cleanup(PREFIX);
    await createSessionUser(PREFIX, "civil1", { departement: "Génie Civil", classe: "DUT2" });
    await createSessionUser(PREFIX, "civil2", { departement: "Génie Civil", classe: "DIC3" });
    await createSessionUser(PREFIX, "gestion", { departement: "Gestion", classe: "DUT2" });
  });

  afterAll(async () => {
    await cleanup(PREFIX);
    await prisma.$disconnect();
  });

  const names = async (filters: { departement?: string; classe?: string }) =>
    (await listUsers({ page: 1, q: PREFIX, ...filters })).rows.map((row) => row.prenom).sort();

  it("filtre par département", async () => {
    expect(await names({ departement: "Génie Civil" })).toEqual(["civil1", "civil2"]);
  });

  it("filtre par classe", async () => {
    expect(await names({ classe: "DUT2" })).toEqual(["civil1", "gestion"]);
  });

  it("combine département, classe et recherche libre", async () => {
    expect(await names({ departement: "Génie Civil", classe: "DUT2" })).toEqual(["civil1"]);
  });

  it("ne renvoie rien pour une classe sans compte", async () => {
    expect(await names({ classe: "CLASSE-INEXISTANTE" })).toEqual([]);
  });

  it("propose dans les filtres les valeurs présentes en base, sans doublon", async () => {
    const facets = await listUserFacets();

    expect(facets.departements).toEqual(expect.arrayContaining(["Génie Civil", "Gestion"]));
    expect(facets.classes.filter((classe) => classe === "DUT2")).toHaveLength(1);
  });
});
