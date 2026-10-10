import { describe, expect, it } from "vitest";
import { getDashboardItems } from "@/lib/admin/dashboardItems";
import type { AppSession } from "@/types/session";

function sessionWith(overrides: Partial<AppSession>): AppSession {
  return {
    userId: "u-1",
    email: "test@esp.sn",
    nom: "Test",
    prenom: "Compte",
    departement: "Gestion",
    classe: "DIC1",
    promo: "2027",
    roles: [],
    isResponsableClasse: false,
    ...overrides,
  };
}

const ids = (session: AppSession) => getDashboardItems(session).map((item) => item.id);

describe("getDashboardItems", () => {
  it("montre à l'Admin les quatre fonctions d'administration", () => {
    expect(ids(sessionWith({ roles: ["admin"] }))).toEqual(["import", "comptes", "roles", "audit"]);
  });

  it("ne montre pas le journal d'audit ni les rôles à un Éditeur", () => {
    expect(ids(sessionWith({ roles: ["editeur"] }))).toEqual(["annonces"]);
  });

  it("ne montre que la file de signalements à un Modérateur", () => {
    expect(ids(sessionWith({ roles: ["moderateur"] }))).toEqual(["signalements"]);
  });

  it("cumule les fonctions quand les rôles se cumulent", () => {
    expect(ids(sessionWith({ roles: ["editeur", "moderateur"] }))).toEqual([
      "annonces",
      "signalements",
    ]);
  });

  it("propose l'ajout à sa classe au responsable de classe uniquement", () => {
    expect(ids(sessionWith({ isResponsableClasse: true }))).toEqual(["ajout-etudiant"]);
    expect(ids(sessionWith({}))).toEqual([]);
  });
});
