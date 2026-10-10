import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { finalizeImport, openImport, processImportBatch } from "@/lib/admin/import/importService";
import type { NumberedRow } from "@/lib/admin/import/validateRow";
import type { AppSession } from "@/types/session";
import { cleanup, createSessionUser, hasDatabase, testEmail } from "./helpers/db";

const PREFIX = "m5import";

function row(line: number, name: string, overrides: Partial<NumberedRow["raw"]> = {}): NumberedRow {
  return {
    line,
    raw: {
      nom: "Importé",
      prenom: name,
      email: testEmail(PREFIX, name),
      departement: "Génie Informatique",
      promo: "2027",
      classe: "DIC1",
      ...overrides,
    },
  };
}

const FILE: NumberedRow[] = [
  row(2, "awa"),
  row(3, "omar"),
  row(4, "fausse", { email: "pas-une-adresse" }),
  row(5, "khady", { classe: "DIC9" }),
];

const countImported = () =>
  prisma.user.count({ where: { email: { startsWith: `${PREFIX}.` }, nom: { not: PREFIX } } });

describe.skipIf(!hasDatabase)("import de la liste blanche", () => {
  let admin: AppSession;

  beforeAll(async () => {
    await cleanup(PREFIX);
    admin = await createSessionUser(PREFIX, "admin", { roles: ["admin"] });
  });

  afterAll(async () => {
    await cleanup(PREFIX);
    await prisma.$disconnect();
  });

  async function runImport(rows: NumberedRow[]) {
    const { id } = await openImport(admin, "Génie Informatique");
    // Marque le lot pour le nettoyage de fin de test.
    await prisma.whitelistImport.update({ where: { id }, data: { batchSource: `test:${PREFIX}` } });
    const batch = await processImportBatch(admin, id, rows);
    const final = await finalizeImport(admin, id, []);
    return { id, batch, final };
  }

  it("n'écrit que les lignes valides et donne la raison de chaque rejet", async () => {
    const { batch, final } = await runImport(FILE);

    expect(batch.created).toBe(2);
    expect(batch.rejected).toEqual([
      { line: 4, errors: ["ADRESSE_INVALIDE"] },
      { line: 5, errors: ["CLASSE_INCONNUE"] },
    ]);
    expect(final.status).toBe("partial");
    expect(await countImported()).toBe(2);
  });

  it("ne crée aucun doublon au réimport du même fichier", async () => {
    const before = await countImported();

    const { batch } = await runImport(FILE);

    expect(batch.created).toBe(0);
    expect(batch.updated).toBe(2);
    expect(await countImported()).toBe(before);
  });

  it("met à jour un compte existant au réimport, l'adresse faisant foi", async () => {
    await runImport([row(2, "awa", { classe: "DIC2", email: testEmail(PREFIX, "AWA").toUpperCase() })]);

    const awa = await prisma.user.findUnique({ where: { email: testEmail(PREFIX, "awa") } });
    expect(awa?.classe).toBe("DIC2");
  });

  it("conserve les rôles d'un compte déjà promu lors d'un réimport", async () => {
    const email = testEmail(PREFIX, "omar");
    await prisma.user.update({ where: { email }, data: { roles: ["editeur"] } });

    await runImport([row(2, "omar")]);

    const omar = await prisma.user.findUnique({ where: { email } });
    expect(omar?.roles).toEqual(["editeur"]);
  });

  it("trace l'import dans le journal d'audit", async () => {
    const { id } = await runImport([row(2, "awa")]);

    const audit = await prisma.auditLog.findFirst({ where: { entity: "whitelist_import", entityId: id } });
    expect(audit).toMatchObject({ action: "import.valide", actorId: admin.userId });
    expect(audit?.actorNomSnapshot).toBe(`admin ${PREFIX}`);
  });

  it("refuse toute ligne une fois l'import clôturé", async () => {
    const { id } = await runImport([row(2, "awa")]);

    await expect(processImportBatch(admin, id, [row(2, "tardif")])).rejects.toMatchObject({ status: 409 });
  });

  it("refuse qu'un autre compte alimente un import qu'il n'a pas ouvert", async () => {
    const other = await createSessionUser(PREFIX, "autreadmin", { roles: ["admin"] });
    const { id } = await openImport(admin, "Gestion");
    await prisma.whitelistImport.update({ where: { id }, data: { batchSource: `test:${PREFIX}` } });

    await expect(processImportBatch(other, id, [row(2, "intrus")])).rejects.toMatchObject({ status: 409 });
  });
});
