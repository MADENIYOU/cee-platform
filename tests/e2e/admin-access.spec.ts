import { test, expect } from "@playwright/test";
import { BASE_URL, SAME_ORIGIN, useProfile } from "./helpers";

const UNKNOWN_ID = "00000000-0000-4000-8000-00000000dead";

test.describe("accès réservé à l'Admin", () => {
  test("un Éditeur ne voit ni le journal d'audit ni la gestion des rôles", async ({ page, context }) => {
    await useProfile(context, "editeur");

    await page.goto("/admin");
    await expect(page.getByRole("link", { name: /gérer les annonces/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /journal d'audit/i })).toHaveCount(0);

    for (const url of ["/admin/audit", "/admin/roles", "/admin/comptes", "/admin/comptes/import"]) {
      await page.goto(url);
      await expect(page.getByRole("heading", { name: "Accès refusé" })).toBeVisible();
    }
  });

  test("les routes d'écriture répondent 403 à un non-admin et 401 à un visiteur", async ({ context }) => {
    await useProfile(context, "editeur");
    const body = { data: { roles: ["admin"], isResponsableClasse: false }, headers: SAME_ORIGIN };

    expect((await context.request.patch(`/api/admin/users/${UNKNOWN_ID}/roles`, body)).status()).toBe(403);
    expect(
      (await context.request.post("/api/admin/imports", { data: { departements: ["Gestion"] }, headers: SAME_ORIGIN })).status()
    ).toBe(403);

    await useProfile(context, "visiteur");
    expect((await context.request.patch(`/api/admin/users/${UNKNOWN_ID}/roles`, body)).status()).toBe(401);
  });

  test("une mutation venant d'une autre origine est rejetée (CSRF)", async ({ context }) => {
    await useProfile(context, "admin");

    const response = await context.request.post("/api/admin/imports", {
      data: { departements: ["Gestion"] },
      headers: { origin: "https://site-malveillant.example" },
    });

    expect(response.status()).toBe(403);
  });
});

test.describe("gestion des rôles", () => {
  test("l'admin attribue un rôle et le retrouve dans le journal d'audit", async ({ page, context }) => {
    await useProfile(context, "etudiant");
    await page.goto("/admin"); // crée le profil local de l'étudiant de test
    await useProfile(context, "admin");

    await page.goto("/admin/roles?q=etudiant.mock");
    const droits = page.getByRole("group", { name: /droits de aïssatou étudiant/i });
    const moderateur = droits.getByLabel("Modérateur");
    const wasChecked = await moderateur.isChecked();
    await moderateur.click();
    await droits.getByRole("button", { name: "Enregistrer" }).click();
    await expect(droits.getByText("Enregistré.")).toBeVisible();

    await page.goto(`/admin/audit?action=${wasChecked ? "role.retire" : "role.attribue"}`);
    await expect(page.getByText(/Aïssatou Étudiant/).first()).toBeVisible();
  });

  test("l'admin filtre les comptes par département et par classe", async ({ page, context }) => {
    await useProfile(context, "admin");
    await page.goto("/admin/roles");

    await page.getByLabel("Département", { exact: true }).selectOption("Génie Informatique");
    await page.getByLabel("Classe", { exact: true }).selectOption("DIC1");
    await page.getByRole("button", { name: "Filtrer" }).click();

    await expect(page).toHaveURL(/departement=G%C3%A9nie\+Informatique/);
    await expect(page).toHaveURL(/classe=DIC1/);
    await expect(page.getByLabel("Classe", { exact: true })).toHaveValue("DIC1");
    await expect(page.getByRole("group", { name: /droits de awa admin/i })).toBeVisible();

    await page.goto("/admin/roles?classe=CLASSE-INEXISTANTE");
    await expect(page.getByText("Aucun compte ne correspond à ces filtres.")).toBeVisible();

    await page.getByRole("link", { name: "Effacer" }).click();
    await expect(page).toHaveURL(/\/admin\/roles$/);
  });

  test("l'admin ne peut pas se retirer son propre rôle Admin", async ({ page, context }) => {
    await useProfile(context, "admin");

    await page.goto("/admin/roles?q=admin.mock");
    const droits = page.getByRole("group", { name: /droits de awa admin/i });
    await droits.getByLabel("Admin", { exact: true }).uncheck();
    await droits.getByRole("button", { name: "Enregistrer" }).click();

    await expect(droits.getByRole("alert")).toContainText(/votre propre rôle Admin/);
    await expect(droits.getByLabel("Admin", { exact: true })).toBeChecked();
  });
});

test.describe("responsable de classe", () => {
  test("ajoute un étudiant à sa propre classe", async ({ page, context }) => {
    await useProfile(context, "responsable");
    const email = `e2e.ajout.${Date.now()}@gmail.com`;

    await page.goto("/classe/ajouter-etudiant");
    await page.getByLabel("Prénom").fill("Ndeye");
    await page.getByLabel("Nom", { exact: true }).fill("Seck");
    await page.getByLabel(/^email/i).fill(email);
    await page.getByRole("button", { name: /ajouter à ma classe/i }).click();

    await expect(page.getByText(/Ndeye Seck a été ajouté·e à la classe DIC1/)).toBeVisible();

    await useProfile(context, "admin");
    await page.goto(`/admin/comptes?q=${email}`);
    await expect(page.getByRole("row", { name: new RegExp(email) })).toContainText("DIC1");
  });

  test("une adresse hors domaine est refusée avant tout envoi", async ({ page, context }) => {
    await useProfile(context, "responsable");

    await page.goto("/classe/ajouter-etudiant");
    await page.getByLabel("Prénom").fill("Ami");
    await page.getByLabel("Nom", { exact: true }).fill("Fall");
    await page.getByLabel(/^email/i).fill("ami@ucad.edu.sn");
    await page.getByRole("button", { name: /ajouter à ma classe/i }).click();

    await expect(page.getByRole("alert").filter({ hasText: /@esp\.sn et @gmail\.com/ })).toBeVisible();
  });

  test("un étudiant sans la permission n'a accès ni à l'écran ni à la route", async ({ page, context }) => {
    await useProfile(context, "etudiant");

    await page.goto("/classe/ajouter-etudiant");
    await expect(page.getByRole("heading", { name: "Accès refusé" })).toBeVisible();

    const response = await context.request.post(`${BASE_URL}/api/classe/etudiants`, {
      data: { nom: "X", prenom: "Y", email: "x.y@esp.sn" },
      headers: SAME_ORIGIN,
    });
    expect(response.status()).toBe(403);
  });
});
