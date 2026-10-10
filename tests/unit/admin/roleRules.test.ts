import { describe, expect, it } from "vitest";
import { checkAccessChange, diffRoles, type AccessChangeContext } from "@/lib/admin/roles/roleRules";

const BASE: AccessChangeContext = {
  actorId: "admin-1",
  targetId: "user-2",
  targetClasse: "DIC1",
  change: { added: [], removed: [] },
  nextIsResponsableClasse: false,
  adminCount: 2,
};

describe("diffRoles", () => {
  it("sépare les rôles attribués des rôles retirés", () => {
    expect(diffRoles(["editeur", "admin"], ["admin", "moderateur"])).toEqual({
      added: ["moderateur"],
      removed: ["editeur"],
    });
  });

  it("ne signale rien si les rôles sont identiques", () => {
    expect(diffRoles(["admin"], ["admin"])).toEqual({ added: [], removed: [] });
  });
});

describe("checkAccessChange", () => {
  it("autorise une attribution ordinaire", () => {
    expect(checkAccessChange({ ...BASE, change: { added: ["editeur"], removed: [] } })).toBeNull();
  });

  it("refuse qu'un admin se retire son propre rôle Admin", () => {
    const refusal = checkAccessChange({
      ...BASE,
      targetId: BASE.actorId,
      change: { added: [], removed: ["admin"] },
    });

    expect(refusal).toMatch(/votre propre rôle Admin/);
  });

  it("refuse de retirer le dernier Admin", () => {
    const refusal = checkAccessChange({
      ...BASE,
      adminCount: 1,
      change: { added: [], removed: ["admin"] },
    });

    expect(refusal).toMatch(/dernier Admin/);
  });

  it("refuse la permission responsable de classe à un compte sans classe", () => {
    const refusal = checkAccessChange({ ...BASE, targetClasse: null, nextIsResponsableClasse: true });

    expect(refusal).toMatch(/pas de classe/);
  });
});
