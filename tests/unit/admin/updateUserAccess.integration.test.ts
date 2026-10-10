import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { updateUserAccess } from "@/lib/admin/roles/updateUserAccess";
import type { AppSession } from "@/types/session";
import { cleanup, createSessionUser, hasDatabase } from "./helpers/db";

const PREFIX = "m5roles";

describe.skipIf(!hasDatabase)("gestion des rôles", () => {
  let admin: AppSession;

  beforeAll(async () => {
    await cleanup(PREFIX);
    admin = await createSessionUser(PREFIX, "admin", { roles: ["admin"] });
  });

  afterAll(async () => {
    await cleanup(PREFIX);
    await prisma.$disconnect();
  });

  const actionsFor = async (entityId: string) =>
    (await prisma.auditLog.findMany({ where: { entityId }, orderBy: { createdAt: "asc" } })).map(
      (row) => row.action
    );

  it("attribue un rôle et trace l'élévation de privilège", async () => {
    const target = await createSessionUser(PREFIX, "promu");

    const result = await updateUserAccess(admin, target.userId, {
      roles: ["editeur"],
      isResponsableClasse: false,
    });

    expect(result.roles).toEqual(["editeur"]);
    expect(await actionsFor(target.userId)).toEqual(["role.attribue"]);
  });

  it("retire un rôle et le trace", async () => {
    const target = await createSessionUser(PREFIX, "retire", { roles: ["moderateur", "editeur"] });

    await updateUserAccess(admin, target.userId, { roles: ["editeur"], isResponsableClasse: false });

    const updated = await prisma.user.findUnique({ where: { id: target.userId } });
    expect(updated?.roles).toEqual(["editeur"]);
    expect(await actionsFor(target.userId)).toEqual(["role.retire"]);
  });

  it("trace l'attribution de la permission responsable de classe", async () => {
    const target = await createSessionUser(PREFIX, "delegue");

    await updateUserAccess(admin, target.userId, { roles: [], isResponsableClasse: true });

    expect(await actionsFor(target.userId)).toEqual(["permission.responsable_classe.attribuee"]);
  });

  it("n'écrit rien dans le journal si rien ne change", async () => {
    const target = await createSessionUser(PREFIX, "inchange", { roles: ["editeur"] });

    await updateUserAccess(admin, target.userId, { roles: ["editeur"], isResponsableClasse: false });

    expect(await actionsFor(target.userId)).toEqual([]);
  });

  it("refuse qu'un admin se retire son propre rôle Admin", async () => {
    await expect(
      updateUserAccess(admin, admin.userId, { roles: [], isResponsableClasse: false })
    ).rejects.toMatchObject({ status: 409 });

    const self = await prisma.user.findUnique({ where: { id: admin.userId } });
    expect(self?.roles).toEqual(["admin"]);
  });

  it("répond 404 pour un compte inconnu", async () => {
    await expect(
      updateUserAccess(admin, "00000000-0000-4000-8000-00000000dead", { roles: [], isResponsableClasse: false })
    ).rejects.toMatchObject({ status: 404 });
  });
});
