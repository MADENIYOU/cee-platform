import { test, expect, type Page } from "@playwright/test";

/**
 * Parcours E2E complet — nécessite la stack de dev (`pnpm dev:stack`)
 * avec le Keycloak pré-seedé (voir keycloak/realm-export.json).
 */

async function loginViaKeycloak(page: Page, username: string, password: string) {
  await page.goto("/");
  await page.getByRole("button", { name: /se connecter avec google/i }).click();

  // Formulaire de connexion Keycloak (realm cee-dev) — locators par id,
  // plus robustes que getByLabel ici : le bouton "afficher le mot de
  // passe" du thème Keycloak porte lui aussi un aria-label contenant
  // "password", ce qui rend getByLabel(/password/i) ambigu.
  await page.locator("#username").fill(username);
  await page.locator("#password").fill(password);
  await page.locator("#kc-login").click();
}

test("un visiteur voit le bouton de connexion", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: /se connecter avec google/i })).toBeVisible();
});

test("connexion avec un domaine autorisé crée une session", async ({ page }) => {
  await loginViaKeycloak(page, "etudiant.test@esp.sn", "test1234");

  await expect(page.getByText(/connecté·e en tant que/i)).toBeVisible();
});

test("connexion avec un domaine refusé est rejetée", async ({ page }) => {
  await loginViaKeycloak(page, "etudiant.refuse@ucad.edu.sn", "test1234");

  await expect(page).toHaveURL(/\/connexion/);
  // Scopé par texte plutôt que getByRole("alert") seul : Next.js injecte
  // son propre annonceur de route (#__next-route-announcer__) qui porte
  // aussi role="alert", rendant le sélecteur générique ambigu.
  await expect(page.getByText(/esp\.sn et @gmail\.com/i)).toBeVisible();
});
