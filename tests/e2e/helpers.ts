import type { BrowserContext } from "@playwright/test";

export const BASE_URL = process.env.AUTH_URL ?? "http://localhost:3000";

type Profile = "admin" | "editeur" | "moderateur" | "responsable" | "etudiant" | "visiteur";

/**
 * Change de profil de session mockée (voir src/lib/auth/session.ts). À
 * remplacer par une vraie connexion Keycloak quand le Module 1 sera intégré.
 */
export async function useProfile(context: BrowserContext, profile: Profile): Promise<void> {
  await context.addCookies([{ name: "cee_mock_profile", value: profile, url: BASE_URL }]);
}

/** Les routes de mutation exigent un en-tête Origin (protection CSRF). */
export const SAME_ORIGIN = { origin: BASE_URL };
