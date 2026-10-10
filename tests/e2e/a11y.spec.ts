import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";

/**
 * Audit WCAG 2.1 AA automatisé (axe-core) — voir
 * Module_Fondations_Identite.md §9 : "audit automatisé + checklist
 * manuelle basique, pas une certification exhaustive avec tests
 * lecteurs d'écran". Ceci couvre la partie automatisée.
 */

const PAGES = ["/", "/connexion"];

for (const path of PAGES) {
  test(`${path} — aucune violation WCAG 2.1 AA (clair, desktop)`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test(`${path} — aucune violation WCAG 2.1 AA (sombre, mobile)`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone-ish
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
}

test("menu Polyspace mobile ouvert — aucune violation WCAG 2.1 AA + focus trap", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");

  await page.getByRole("button", { name: /ouvrir les applications du polyspace/i }).click();

  // Le dialogue doit être annoncé et son titre visible (géré par Radix).
  await expect(page.getByRole("dialog")).toBeVisible();

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);

  // Focus trap : Tab ne doit jamais faire sortir le focus du dialogue tant
  // qu'il est ouvert (Radix Dialog le garantit, on le vérifie quand même).
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Tab");
    const focusStaysInDialog = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      return !!dialog && dialog.contains(document.activeElement);
    });
    expect(focusStaysInDialog).toBe(true);
  }

  // Échap doit fermer le menu et rendre le focus gérable.
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
