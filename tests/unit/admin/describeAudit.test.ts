import { describe, expect, it } from "vitest";
import { AUDIT_ACTION_OPTIONS, describeAudit } from "@/lib/admin/audit/describeAudit";

const row = (action: string, metadata: unknown, entity = "user") => describeAudit({ action, entity, metadata });

describe("describeAudit", () => {
  it("résume un import en une phrase", () => {
    expect(
      row(
        "import.valide",
        { source: "departement:Génie Informatique", status: "partial", created: 2, updated: 0, rejected: 1 },
        "whitelist_import"
      )
    ).toEqual({
      quoi: "Import de la liste blanche",
      objet: "Liste de Génie Informatique",
      details: "2 comptes créés, 0 mis à jour, 1 ligne écartée.",
    });
  });

  it("dit clairement qu'un import n'a rien importé", () => {
    const { details } = row("import.valide", { status: "failed", created: 0, updated: 0, rejected: 4 });

    expect(details).toBe("Aucun compte importé. 0 compte créé, 0 mis à jour, 4 lignes écartées.");
  });

  it("nomme la personne concernée et le rôle reçu", () => {
    expect(row("role.attribue", { cible: "Awa Diop", role: "editeur", apres: ["editeur", "admin"] })).toEqual({
      quoi: "Attribution d'un rôle",
      objet: "Awa Diop",
      details: "A reçu le rôle Éditeur. Rôles actuels : Éditeur, Admin.",
    });
  });

  it("indique qu'il ne reste aucun rôle après un retrait", () => {
    const { details } = row("role.retire", { cible: "Awa Diop", role: "moderateur", apres: [] });

    expect(details).toBe("A perdu le rôle Modérateur. Rôles restants : aucun.");
  });

  it("explique ce que permet la responsabilité de classe", () => {
    expect(row("permission.responsable_classe.attribuee", { cible: "Omar Fall", classe: "DIC1" })).toEqual({
      quoi: "Nomination d'un responsable de classe",
      objet: "Omar Fall",
      details: "Devient responsable de la classe DIC1 : peut y ajouter un étudiant manquant.",
    });
  });

  it("décrit l'ajout d'un étudiant avec sa classe et son département", () => {
    expect(row("etudiant.ajoute", { cible: "Binta Sarr", classe: "DUT2", departement: "Génie Civil" })).toEqual({
      quoi: "Ajout d'un étudiant",
      objet: "Binta Sarr",
      details: "Ajouté à la classe DUT2 (Génie Civil) par son responsable de classe.",
    });
  });

  it("reste lisible quand une ancienne ligne n'a pas tous les détails", () => {
    expect(row("etudiant.ajoute", null)).toEqual({
      quoi: "Ajout d'un étudiant",
      objet: "Un étudiant",
      details: "Ajouté à sa classe par son responsable de classe.",
    });
    expect(row("role.attribue", "pas un objet").objet).toBe("Un compte");
  });

  it("affiche telle quelle une action écrite par un autre module", () => {
    expect(row("annonce.publiee", { titre: "Rentrée" }, "annonce")).toEqual({
      quoi: "annonce.publiee",
      objet: "Annonce",
      details: "—",
    });
  });

  it("propose les actions du filtre avec leur libellé en clair", () => {
    expect(AUDIT_ACTION_OPTIONS).toContainEqual({ value: "role.attribue", label: "Attribution d'un rôle" });
  });
});
