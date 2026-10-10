import { describe, expect, it } from "vitest";
import { describeSheetError, mapSheet } from "@/lib/admin/import/mapSheet";

const HEADER = ["Nom", "Prénom", "Email", "Département", "Promo", "Classe"];

describe("mapSheet", () => {
  it("associe les colonnes quel que soit leur ordre, leur casse ou leurs accents", () => {
    const result = mapSheet([
      ["CLASSE", "promo", "Departement", "E-mail", "prenom", "NOM"],
      ["DIC1", 2027, "Gestion", "awa@esp.sn", "Awa", "Diop"],
    ]);

    expect(result).toEqual({
      ok: true,
      rows: [
        {
          line: 2,
          raw: {
            nom: "Diop",
            prenom: "Awa",
            email: "awa@esp.sn",
            departement: "Gestion",
            promo: "2027",
            classe: "DIC1",
          },
        },
      ],
    });
  });

  it("garde le numéro de ligne du tableur et ignore les lignes vides", () => {
    const result = mapSheet([
      HEADER,
      ["Diop", "Awa", "awa@esp.sn", "Gestion", "2027", "DIC1"],
      [null, null, null, null, null, null],
      ["Fall", "Omar", "omar@esp.sn", "Gestion", "2027", "DIC1"],
    ]);

    expect(result.ok && result.rows.map((row) => row.line)).toEqual([2, 4]);
  });

  it("signale les colonnes manquantes avant tout envoi", () => {
    const result = mapSheet([["Nom", "Prénom", "Classe"], ["Diop", "Awa", "DIC1"]]);

    expect(result).toEqual({
      ok: false,
      code: "COLONNES_MANQUANTES",
      missing: ["Email", "Département", "Promo"],
    });
    expect(!result.ok && describeSheetError(result)).toBe(
      "Colonnes manquantes : Email, Département, Promo."
    );
  });

  it("refuse un fichier sans ligne d'étudiant", () => {
    expect(mapSheet([HEADER])).toEqual({ ok: false, code: "FICHIER_VIDE" });
    expect(mapSheet([])).toEqual({ ok: false, code: "FICHIER_VIDE" });
  });
});
