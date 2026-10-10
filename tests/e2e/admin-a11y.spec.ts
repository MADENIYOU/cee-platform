import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";
import { useProfile } from "./helpers";

/**
 * Audit WCAG 2.1 AA automatisé des écrans du Module 5 (cible réaliste du
 * cadrage : audit automatisé + checklist manuelle), en clair et en sombre,
 * sur mobile d'abord.
 */
const ADMIN_PAGES = ["/admin", "/admin/comptes", "/admin/comptes/import", "/admin/roles", "/admin/audit"];
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`accessibilité — thème ${colorScheme}`, () => {
    test.use({ colorScheme, viewport: { width: 390, height: 844 } });

    for (const url of ADMIN_PAGES) {
      test(`${url} n'a aucune violation WCAG 2.1 AA`, async ({ page, context }) => {
        await useProfile(context, "admin");
        await page.goto(url);

        const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

        expect(results.violations).toEqual([]);
      });
    }

    test("l'écran du responsable de classe n'a aucune violation WCAG 2.1 AA", async ({ page, context }) => {
      await useProfile(context, "responsable");
      await page.goto("/classe/ajouter-etudiant");

      const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

      expect(results.violations).toEqual([]);
    });
  });
}
