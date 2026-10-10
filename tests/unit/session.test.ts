import { describe, expect, it, vi, beforeEach } from "vitest";

const authMock = vi.fn();
vi.mock("@/lib/auth/auth.config", () => ({ auth: authMock }));

const { requireRole, ForbiddenError, UnauthorizedError } = await import("@/lib/auth/session");

function mockSessionUser(overrides: Partial<Record<string, unknown>> = {}) {
  authMock.mockResolvedValue({
    user: {
      userId: "uuid-1",
      email: "etudiant@esp.sn",
      nom: "Test",
      prenom: "Etudiant",
      departement: null,
      classe: null,
      promo: null,
      roles: [],
      isResponsableClasse: false,
      ...overrides,
    },
  });
}

describe("requireRole", () => {
  beforeEach(() => {
    authMock.mockReset();
  });

  it("lève UnauthorizedError si aucune session", async () => {
    authMock.mockResolvedValue(null);
    await expect(requireRole("editeur")).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("lève ForbiddenError si le rôle requis est absent", async () => {
    mockSessionUser({ roles: ["moderateur"] });
    await expect(requireRole("editeur")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("retourne la session si le rôle requis est présent", async () => {
    mockSessionUser({ roles: ["editeur", "admin"] });
    const session = await requireRole("editeur");
    expect(session.roles).toContain("editeur");
  });
});
