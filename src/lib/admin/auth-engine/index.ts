import "server-only";
import { mockAuthEngine } from "@/lib/admin/auth-engine/mockAuthEngine";
import type { AuthEnginePort } from "@/lib/admin/auth-engine/port";

/**
 * Point unique de sélection de l'adaptateur. L'adaptateur réel (API admin
 * Keycloak via `fetchWithRetry`, backoff 1 s / 3 s / 6 s, jamais sur 4xx)
 * se branchera ici quand le contrat d'API sera confirmé.
 */
export function getAuthEngine(): AuthEnginePort {
  return mockAuthEngine;
}

export { AuthEngineError } from "@/lib/admin/auth-engine/port";
export type { AuthEnginePort, PushedIdentity, WhitelistEntry } from "@/lib/admin/auth-engine/port";
