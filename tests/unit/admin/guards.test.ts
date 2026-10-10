import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AppSession } from "@/types/session";

const getSessionMock = vi.fn<() => Promise<AppSession | null>>();
vi.mock("@/lib/auth/session", () => {
  class UnauthorizedError extends Error {}
  class ForbiddenError extends Error {}
  return { getSession: getSessionMock, UnauthorizedError, ForbiddenError };
});

const { requireResponsableClasse, hasAdminAccess, actorSnapshot } = await import("@/lib/admin/guards");
const { UnauthorizedError, ForbiddenError } = await import("@/lib/auth/session");

const STUDENT: AppSession = {
  userId: "u-1",
  email: "etudiant@esp.sn",
  nom: "Diop",
  prenom: "Awa",
  departement: "Gestion",
  classe: "DIC1",
  promo: "2027",
  roles: [],
  isResponsableClasse: false,
};

describe("requireResponsableClasse", () => {
  beforeEach(() => getSessionMock.mockReset());

  it("refuse un visiteur non connecté", async () => {
    getSessionMock.mockResolvedValue(null);
    await expect(requireResponsableClasse()).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("refuse un étudiant sans la permission", async () => {
    getSessionMock.mockResolvedValue(STUDENT);
    await expect(requireResponsableClasse()).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("refuse un responsable dont la classe est inconnue", async () => {
    getSessionMock.mockResolvedValue({ ...STUDENT, isResponsableClasse: true, classe: null });
    await expect(requireResponsableClasse()).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("refuse un Admin qui n'a pas la permission : ce n'est pas un rôle", async () => {
    getSessionMock.mockResolvedValue({ ...STUDENT, roles: ["admin"] });
    await expect(requireResponsableClasse()).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("accepte un responsable de classe et renvoie sa classe", async () => {
    getSessionMock.mockResolvedValue({ ...STUDENT, isResponsableClasse: true });
    await expect(requireResponsableClasse()).resolves.toMatchObject({ classe: "DIC1" });
  });
});

describe("hasAdminAccess", () => {
  it("vaut vrai pour tout droit d'administration, faux sinon", () => {
    expect(hasAdminAccess({ ...STUDENT, roles: ["moderateur"] })).toBe(true);
    expect(hasAdminAccess(STUDENT)).toBe(false);
    expect(hasAdminAccess(null)).toBe(false);
  });
});

describe("actorSnapshot", () => {
  it("compose prénom et nom", () => {
    expect(actorSnapshot(STUDENT)).toBe("Awa Diop");
  });
});
