import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/logAudit";
import { listAuditLogs } from "@/lib/admin/audit/listAuditLogs";
import { PAGE_SIZE } from "@/lib/admin/pagination";
import { cleanup, createSessionUser, hasDatabase } from "./helpers/db";

const PREFIX = "m5audit";
const ENTITY = `test-${PREFIX}`;

describe.skipIf(!hasDatabase)("journal d'audit", () => {
  beforeAll(async () => {
    await cleanup(PREFIX);
    await prisma.auditLog.deleteMany({ where: { entity: ENTITY } });
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({ where: { entity: ENTITY } });
    await cleanup(PREFIX);
    await prisma.$disconnect();
  });

  it("reste lisible pour une action dont l'acteur a été purgé par Keycloak", async () => {
    const actor = await createSessionUser(PREFIX, "purge");
    await logAudit({
      actorId: actor.userId,
      actorNomSnapshot: `Awa ${PREFIX}`,
      action: "role.attribue",
      entity: ENTITY,
      entityId: "cible-1",
    });

    // Simule la purge à 6 mois : le compte disparaît sans prévenir.
    await prisma.user.delete({ where: { id: actor.userId } });

    const page = await listAuditLogs({ page: 1, entity: ENTITY });
    expect(page.rows).toEqual([
      expect.objectContaining({ actorNom: `Awa ${PREFIX}`, actorPurged: true, action: "role.attribue" }),
    ]);
  });

  it("pagine côté serveur et filtre par action et par acteur", async () => {
    await prisma.auditLog.createMany({
      data: Array.from({ length: PAGE_SIZE + 5 }, (_, index) => ({
        actorNomSnapshot: `Série ${PREFIX}`,
        action: index % 2 === 0 ? "import.valide" : "etudiant.ajoute",
        entity: ENTITY,
        entityId: `serie-${index}`,
      })),
    });

    const first = await listAuditLogs({ page: 1, entity: ENTITY, acteur: "série" });
    const second = await listAuditLogs({ page: 2, entity: ENTITY, acteur: "série" });
    const imports = await listAuditLogs({ page: 1, entity: ENTITY, action: "IMPORT" });

    expect(first.rows).toHaveLength(PAGE_SIZE);
    expect(first.total).toBe(PAGE_SIZE + 5);
    expect(first.pageCount).toBe(2);
    expect(second.rows).toHaveLength(5);
    expect(imports.rows.every((row) => row.action === "import.valide")).toBe(true);
  });
});
