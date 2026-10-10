import { randomUUID } from "node:crypto";
import type { AuthEnginePort } from "@/lib/admin/auth-engine/port";

/**
 * MOCK — journalise l'appel sans l'exécuter, tant que le contrat d'API de
 * l'équipe auth n'est pas confirmé (Module_Administration_Comptes.md §2).
 *
 * L'identifiant renvoyé est provisoire : le vrai moteur renverra le `sub`
 * Keycloak. Ne journalise que le volume, jamais les adresses.
 */
export const mockAuthEngine: AuthEnginePort = {
  async pushWhitelist(entries) {
    console.info(`[auth-engine:mock] poussée simulée de ${entries.length} identité(s)`);
    return entries.map((entry) => ({ email: entry.email, externalId: randomUUID() }));
  },
};
