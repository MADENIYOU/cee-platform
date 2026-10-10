import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { addStudentToOwnClass } from "@/lib/admin/users/addStudentToClass";
import type { ResponsableSession } from "@/lib/admin/guards";
import { cleanup, createSessionUser, hasDatabase, testEmail } from "./helpers/db";

const PREFIX = "m5classe";

describe.skipIf(!hasDatabase)("ajout par le responsable de classe", () => {
  let responsable: ResponsableSession;

  beforeAll(async () => {
    await cleanup(PREFIX);
    const session = await createSessionUser(PREFIX, "responsable", {
      isResponsableClasse: true,
      departement: "Génie Civil",
      classe: "DUT2",
      promo: "2028",
    });
    responsable = { ...session, classe: "DUT2" };
  });

  afterAll(async () => {
    await cleanup(PREFIX);
    await prisma.$disconnect();
  });

  it("inscrit l'étudiant dans la classe du responsable, jamais ailleurs", async () => {
    // Une requête forgée tente d'imposer une autre classe : elle est ignorée.
    const forged = { nom: "Sarr", prenom: "Binta", email: testEmail(PREFIX, "binta"), classe: "DIC3" };

    const { id } = await addStudentToOwnClass(responsable, forged);

    const created = await prisma.user.findUnique({ where: { id } });
    expect(created).toMatchObject({ classe: "DUT2", departement: "Génie Civil", promo: "2028", roles: [] });
  });

  it("trace l'ajout dans le journal d'audit", async () => {
    const { id } = await addStudentToOwnClass(responsable, {
      nom: "Ba",
      prenom: "Cheikh",
      email: testEmail(PREFIX, "cheikh"),
    });

    const audit = await prisma.auditLog.findFirst({ where: { entity: "user", entityId: id } });
    expect(audit).toMatchObject({ action: "etudiant.ajoute", actorId: responsable.userId });
  });

  it("refuse une adresse déjà inscrite sans toucher au compte existant", async () => {
    const email = testEmail(PREFIX, "existant");
    await createSessionUser(PREFIX, "existant", { classe: "M1" });

    await expect(
      addStudentToOwnClass(responsable, { nom: "Autre", prenom: "Nom", email })
    ).rejects.toMatchObject({ status: 409 });

    const untouched = await prisma.user.findUnique({ where: { email } });
    expect(untouched).toMatchObject({ classe: "M1", prenom: "existant" });
  });

  it("refuse une adresse hors des domaines autorisés avec une raison lisible", async () => {
    await expect(
      addStudentToOwnClass(responsable, { nom: "Fall", prenom: "Ami", email: "ami@ucad.edu.sn" })
    ).rejects.toMatchObject({ status: 422, message: expect.stringContaining("@esp.sn") });
  });
});
