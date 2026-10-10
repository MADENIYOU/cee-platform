import { afterEach, describe, expect, it, vi } from "vitest";
import { sendJson } from "@/lib/admin/apiClient";
import { MAX_FILE_BYTES } from "@/lib/admin/import/columns";
import { checkFile } from "@/lib/admin/import/readWorkbook";
import { runImport, toBatches } from "@/lib/admin/import/runImport";
import type { ValidRow } from "@/lib/admin/import/validateRow";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function validRows(count: number): ValidRow[] {
  return Array.from({ length: count }, (_, index) => ({
    line: index + 2,
    row: {
      nom: "Diop",
      prenom: `Awa${index}`,
      email: `awa${index}@esp.sn`,
      departement: "Gestion",
      promo: "2027",
      classe: "DIC1",
    },
  }));
}

afterEach(() => vi.unstubAllGlobals());

describe("checkFile", () => {
  it("accepte un fichier .xlsx de taille raisonnable", () => {
    expect(checkFile({ name: "Liste GI.XLSX", size: 20_000 })).toBeNull();
  });

  it.each([
    [{ name: "liste.csv", size: 100 }, /\.xlsx/],
    [{ name: "liste.xlsx", size: 0 }, /vide/],
    [{ name: "liste.xlsx", size: MAX_FILE_BYTES + 1 }, /dépasse/],
  ])("refuse %o avant toute lecture", (file, expected) => {
    expect(checkFile(file)).toMatch(expected);
  });
});

describe("sendJson", () => {
  it("renvoie le message du serveur quand la requête est refusée", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ error: "Compte introuvable." }, 404)));

    await expect(sendJson("/api/x", "POST", {})).resolves.toEqual({
      ok: false,
      error: "Compte introuvable.",
    });
  });

  it("mappe une panne réseau en message lisible, sans exception", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    const result = await sendJson("/api/x", "POST", {});

    expect(result).toEqual({ ok: false, error: expect.stringContaining("Connexion impossible") });
  });
});

describe("runImport", () => {
  it("découpe en paquets de 200 lignes", () => {
    expect(toBatches(validRows(450), 200).map((batch) => batch.length)).toEqual([200, 200, 50]);
  });

  it("envoie les paquets dans l'ordre, signale la progression, puis clôt", async () => {
    const outcome = { status: "success", report: { created: 250, updated: 0, rejectedCount: 0, rejected: [] } };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json({ id: "imp-1" }, 201))
      .mockResolvedValueOnce(json({}))
      .mockResolvedValueOnce(json({}))
      .mockResolvedValueOnce(json(outcome));
    vi.stubGlobal("fetch", fetchMock);
    const progress: number[] = [];

    const result = await runImport({
      departement: "Gestion",
      valid: validRows(250),
      rejected: [],
      onProgress: (sent) => progress.push(sent),
    });

    expect(result).toEqual({ ok: true, data: outcome });
    expect(progress).toEqual([200, 250]);
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "/api/admin/imports",
      "/api/admin/imports/imp-1/rows",
      "/api/admin/imports/imp-1/rows",
      "/api/admin/imports/imp-1/finalize",
    ]);
  });

  it("s'arrête au premier paquet en échec, sans rejeu automatique", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json({ id: "imp-1" }, 201))
      .mockResolvedValueOnce(json({ error: "Le moteur d'authentification est indisponible." }, 502));
    vi.stubGlobal("fetch", fetchMock);

    const result = await runImport({
      departement: "Gestion",
      valid: validRows(450),
      rejected: [],
      onProgress: () => {},
    });

    expect(result).toEqual({ ok: false, error: "Le moteur d'authentification est indisponible." });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
