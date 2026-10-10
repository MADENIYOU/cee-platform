import { describe, expect, it } from "vitest";
import { validateRow, validateRows, type RawRow } from "@/lib/admin/import/validateRow";

const VALID: RawRow = {
  nom: " Diop ",
  prenom: "Awa",
  email: " Awa.Diop@ESP.sn ",
  departement: "genie informatique",
  promo: "2027",
  classe: "dic1",
};

describe("validateRow", () => {
  it("accepte une ligne valide et la normalise", () => {
    const result = validateRow(VALID);

    expect(result).toEqual({
      ok: true,
      row: {
        nom: "Diop",
        prenom: "Awa",
        email: "awa.diop@esp.sn",
        departement: "Génie Informatique",
        promo: "2027",
        classe: "DIC1",
      },
    });
  });

  it.each([
    ["adresse malformée", { email: "awa.diop" }, "ADRESSE_INVALIDE"],
    ["domaine refusé", { email: "awa@ucad.edu.sn" }, "DOMAINE_REFUSE"],
    ["département inconnu", { departement: "Génie Spatial" }, "DEPARTEMENT_INCONNU"],
    ["classe inexistante", { classe: "DIC9" }, "CLASSE_INCONNUE"],
    ["promo invalide", { promo: "27" }, "PROMO_INVALIDE"],
    ["nom vide", { nom: "  " }, "NOM_MANQUANT"],
    ["prénom vide", { prenom: "" }, "PRENOM_MANQUANT"],
  ])("rejette une ligne avec %s", (_label, override, expectedCode) => {
    const result = validateRow({ ...VALID, ...override });

    expect(result).toEqual({ ok: false, errors: [expectedCode] });
  });

  it("remonte toutes les raisons d'une ligne, pas seulement la première", () => {
    const result = validateRow({ ...VALID, email: "x", classe: "?" });

    expect(result).toEqual({ ok: false, errors: ["ADRESSE_INVALIDE", "CLASSE_INCONNUE"] });
  });
});

describe("validateRows", () => {
  it("n'écarte que les lignes en erreur, les autres passent", () => {
    const { valid, rejected } = validateRows([
      { line: 2, raw: VALID },
      { line: 3, raw: { ...VALID, email: "pas-une-adresse" } },
      { line: 4, raw: { ...VALID, email: "moussa@gmail.com" } },
    ]);

    expect(valid.map((v) => v.line)).toEqual([2, 4]);
    expect(rejected).toEqual([
      expect.objectContaining({ line: 3, errors: ["ADRESSE_INVALIDE"] }),
    ]);
  });

  it("rejette en doublon une adresse déjà vue, sans tenir compte de la casse", () => {
    const { valid, rejected } = validateRows([
      { line: 2, raw: VALID },
      { line: 3, raw: { ...VALID, email: "AWA.DIOP@esp.sn" } },
    ]);

    expect(valid).toHaveLength(1);
    expect(rejected).toEqual([expect.objectContaining({ line: 3, errors: ["DOUBLON_FICHIER"] })]);
  });
});
