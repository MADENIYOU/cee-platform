"use server";

import { signIn, signOut } from "@/lib/auth/auth.config";

/**
 * Server Actions — pattern recommandé par Auth.js v5 et par le guide
 * d'authentification Next.js 16 (Server Actions = CSRF géré nativement
 * par le framework, pas de token à manipuler à la main).
 */
export async function signInAction(): Promise<void> {
  await signIn("keycloak");
}

export async function signOutAction(): Promise<void> {
  await signOut();
}
