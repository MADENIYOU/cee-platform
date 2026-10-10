import { describe, expect, it, vi, beforeEach } from "vitest";

const createMock = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: { auditLog: { create: createMock } },
}));

const { logAudit } = await import("@/lib/audit/logAudit");

describe("logAudit", () => {
  beforeEach(() => {
    createMock.mockReset();
  });

  it("écrit une ligne avec l'instantané du nom de l'acteur", async () => {
    createMock.mockResolvedValue({});

    await logAudit({
      actorId: "uuid-1",
      actorNomSnapshot: "Jean Dupont",
      action: "annonce.publiee",
      entity: "annonce",
      entityId: "annonce-1",
      metadata: { titre: "Test" },
    });

    expect(createMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorId: "uuid-1",
        actorNomSnapshot: "Jean Dupont",
        action: "annonce.publiee",
        entity: "annonce",
        entityId: "annonce-1",
      }),
    });
  });

  it("n'interrompt pas l'appelant si l'écriture échoue (règle try/catch/finally)", async () => {
    createMock.mockRejectedValue(new Error("DB indisponible"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      logAudit({
        actorId: null,
        actorNomSnapshot: "Visiteur",
        action: "test.action",
        entity: "test",
        entityId: "x",
      })
    ).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
