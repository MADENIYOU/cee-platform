import { fileURLToPath } from "node:url";
import { test, expect, type Page } from "@playwright/test";
import { useProfile } from "./helpers";

/**
 * Parcours complet « import → aperçu des erreurs → validation → poussée
 * vers le moteur d'auth » (règle n°15). Nécessite PostgreSQL et
 * CEE_MOCK_SESSION (voir README).
 *
 * Le fichier de test contient 4 étudiants fictifs : 2 valides, 1 adresse
 * invalide (ligne 4), 1 classe inexistante (ligne 5).
 */
const FIXTURE = fileURLToPath(new URL("./fixtures/liste-blanche-test.xlsx", import.meta.url));

/** Le champ reste désactivé tant que la page n'est pas interactive : Playwright attend qu'il le soit. */
async function openImportPage(page: Page) {
  await page.goto("/admin/comptes/import");
  await expect(page.getByLabel(/fichier excel/i)).toBeEnabled();
}

async function importFixture(page: Page) {
  await openImportPage(page);
  await page.getByLabel(/fichier excel/i).setInputFiles(FIXTURE);

  await expect(page.getByRole("heading", { name: /aperçu de/i })).toBeVisible();
  await expect(page.getByText(/2 lignes prêtes à être importées — 2 écartées, les autres passent/)).toBeVisible();

  // L'aperçu montre ce qui sera importé, pas seulement les erreurs.
  const toImport = page.getByRole("region", { name: "Étudiants à importer" });
  await expect(toImport.getByRole("row")).toHaveCount(3); // en-tête + 2 étudiants
  await expect(toImport.getByRole("cell", { name: "e2e.mariama@esp.sn" })).toBeVisible();
  await expect(toImport.getByRole("cell", { name: "e2e.abdou@gmail.com" })).toBeVisible();
  await expect(toImport.getByText("adresse-invalide")).toHaveCount(0);

  await expect(page.getByText(/Ligne 4/)).toBeVisible();
  await expect(page.getByText(/L'adresse n'a pas un format valide/)).toBeVisible();
  await expect(page.getByText(/Cette classe n'existe pas/)).toBeVisible();

  // Le département vient du fichier : aucune saisie supplémentaire.
  await expect(page.getByLabel(/structure départementale/i)).toHaveCount(0);
  await page.getByRole("button", { name: /valider l'import/i }).click();

  await expect(page.getByRole("heading", { name: /bilan de l'import : succès partiel/i })).toBeVisible();
  await expect(page.getByText(/transmises au moteur d'authentification/)).toBeVisible();
}

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ context }) => {
  await useProfile(context, "admin");
});

test("l'admin importe un fichier : aperçu des erreurs, validation, bilan", async ({ page }) => {
  await importFixture(page);

  await page.goto("/admin/comptes?q=e2e.mariama");
  await expect(page.getByRole("cell", { name: "e2e.mariama@esp.sn" })).toBeVisible();

  // Les lignes en erreur n'ont créé aucun compte.
  await page.goto("/admin/comptes?q=e2e.pape");
  await expect(page.getByText(/aucun compte ne correspond/i)).toBeVisible();
});

test("un réimport du même fichier ne crée aucun doublon", async ({ page }) => {
  await importFixture(page);

  await expect(page.getByText(/0 compte créé, 2 mis à jour, 2 lignes écartées/)).toBeVisible();

  for (const email of ["e2e.mariama@esp.sn", "e2e.abdou@gmail.com"]) {
    await page.goto(`/admin/comptes?q=${email}`);
    await expect(page.getByText(/— 1 résultat$/)).toBeVisible();
  }
});

test("l'import apparaît dans le journal d'audit", async ({ page }) => {
  await page.goto("/admin/audit?action=import.valide");

  // Le journal parle en clair : pas de nom technique ni de données brutes.
  await expect(page.getByRole("cell", { name: "Import de la liste blanche" }).first()).toBeVisible();
  await expect(page.getByRole("cell", { name: "Liste de Génie Informatique" }).first()).toBeVisible();
  await expect(page.getByRole("cell", { name: /mis à jour, 2 lignes écartées\./ }).first()).toBeVisible();
  await expect(page.getByRole("cell", { name: "import.valide" })).toHaveCount(0);
  await expect(page.getByLabel("Quoi", { exact: true })).toHaveValue("import.valide");
  await expect(page.getByRole("cell", { name: /Awa Admin/ }).first()).toBeVisible();
});

test("l'aperçu d'un gros fichier est paginé", async ({ page }) => {
  // 60 étudiants fictifs valides : 3 pages de 25, 25 et 10 lignes. Rien n'est importé.
  const bigFile = fileURLToPath(new URL("./fixtures/liste-60-etudiants.xlsx", import.meta.url));
  await openImportPage(page);
  await page.getByLabel(/fichier excel/i).setInputFiles(bigFile);

  const toImport = page.getByRole("region", { name: "Étudiants à importer" });
  await expect(page.getByRole("heading", { name: "60 étudiants à importer" })).toBeVisible();
  await expect(page.getByText("Page 1 sur 3")).toBeVisible();
  await expect(toImport.getByRole("row")).toHaveCount(26); // en-tête + 25
  await expect(page.getByRole("button", { name: "Précédent" })).toBeDisabled();

  await page.getByRole("button", { name: "Suivant" }).click();
  await expect(page.getByText("Page 2 sur 3")).toBeVisible();
  await expect(toImport.getByRole("cell", { name: "e2e.page26@esp.sn" })).toBeVisible();

  await page.getByRole("button", { name: "Suivant" }).click();
  await expect(toImport.getByRole("row")).toHaveCount(11); // en-tête + 10
  await expect(page.getByRole("button", { name: "Suivant" })).toBeDisabled();
});

test("un fichier qui n'est pas un .xlsx est refusé avant tout envoi", async ({ page }) => {
  await openImportPage(page);
  await page.getByLabel(/fichier excel/i).setInputFiles({
    name: "liste.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("Nom,Prénom\n"),
  });

  await expect(page.getByRole("alert").filter({ hasText: /format \.xlsx/ })).toBeVisible();
});
