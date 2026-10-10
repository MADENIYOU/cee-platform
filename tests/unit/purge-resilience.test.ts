import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/logAudit";

/**
 * Test d'intégration — vérifie la contrainte critique du Module 1 §5 :
 * la suppression d'un utilisateur ne doit JAMAIS casser ou effacer les
 * lignes d'audit qu'il a générées (simule la purge Keycloak à 6 mois
 * d'inactivité, qui supprime le compte sans garantie de synchronisation).
 *
 * Nécessite une vraie base PostgreSQL (DATABASE_URL) — voir
 * `pnpm dev:stack` dans package.json. Ignoré silencieusement si absent.
 */
const hasDatabase = !!process.env.DATABASE_URL;

describe.skipIf(!hasDatabase)("résilience à la purge Keycloak", () => {
  const testUserId = "11111111-1111-1111-1111-111111111111";

  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { id: testUserId } });
    await prisma.user.create({
      data: {
        id: testUserId,
        email: "purge-test@esp.sn",
        nom: "Purge",
        prenom: "Test",
      },
    });
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({ where: { actorId: testUserId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
    await prisma.$disconnect();
  });

  it("conserve la ligne d'audit, lisible, après suppression du compte", async () => {
    await logAudit({
      actorId: testUserId,
      actorNomSnapshot: "Test Purge",
      action: "test.action",
      entity: "test",
      entityId: "entity-1",
    });

    // Simule la purge Keycloak : suppression directe du compte local.
    await prisma.user.delete({ where: { id: testUserId } });

    const auditRow = await prisma.auditLog.findFirst({
      where: { entity: "test", entityId: "entity-1" },
    });

    expect(auditRow).not.toBeNull();
    expect(auditRow?.actorId).toBeNull(); // ON DELETE SET NULL, jamais CASCADE
    expect(auditRow?.actorNomSnapshot).toBe("Test Purge"); // instantané préservé
  });
});
