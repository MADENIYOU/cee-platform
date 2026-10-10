import { describe, expect, it } from "vitest";
import {
  EMPTY_REPORT,
  MAX_STORED_REJECTIONS,
  addToReport,
  computeStatus,
  parseReport,
} from "@/lib/admin/import/report";

describe("addToReport", () => {
  it("cumule les compteurs sans modifier le bilan d'origine", () => {
    const first = addToReport(EMPTY_REPORT, { created: 3, updated: 1 });
    const second = addToReport(first, {
      created: 2,
      rejected: [{ line: 9, errors: ["ADRESSE_INVALIDE"] }],
    });

    expect(EMPTY_REPORT).toEqual({ created: 0, updated: 0, rejectedCount: 0, rejected: [] });
    expect(second).toEqual({
      created: 5,
      updated: 1,
      rejectedCount: 1,
      rejected: [{ line: 9, errors: ["ADRESSE_INVALIDE"] }],
    });
  });

  it("plafonne le détail stocké mais garde un compteur exact", () => {
    const rejected = Array.from({ length: MAX_STORED_REJECTIONS + 20 }, (_, index) => ({
      line: index + 2,
      errors: ["CLASSE_INCONNUE" as const],
    }));

    const report = addToReport(EMPTY_REPORT, { rejected });

    expect(report.rejected).toHaveLength(MAX_STORED_REJECTIONS);
    expect(report.rejectedCount).toBe(MAX_STORED_REJECTIONS + 20);
  });
});

describe("computeStatus", () => {
  it.each([
    [{ created: 4, updated: 0, rejectedCount: 0 }, "success"],
    [{ created: 0, updated: 4, rejectedCount: 0 }, "success"],
    [{ created: 3, updated: 0, rejectedCount: 2 }, "partial"],
    [{ created: 0, updated: 0, rejectedCount: 5 }, "failed"],
    [{ created: 0, updated: 0, rejectedCount: 0 }, "failed"],
  ] as const)("%o → %s", (counters, expected) => {
    expect(computeStatus({ ...counters, rejected: [] })).toBe(expected);
  });
});

describe("parseReport", () => {
  it("retombe sur un bilan vide si le JSON stocké est inattendu", () => {
    expect(parseReport(null)).toEqual(EMPTY_REPORT);
    expect(parseReport({ created: "beaucoup" })).toEqual(EMPTY_REPORT);
  });
});
