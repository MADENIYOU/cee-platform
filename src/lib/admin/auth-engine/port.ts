/**
 * Port vers le moteur d'authentification partagé (Keycloak mutualisé).
 *
 * La liste blanche est POUSSÉE vers le moteur, qui reste la source de vérité
 * de tout l'écosystème étudiant (Plateforme_CEE_Fusion.md §2). Le contrat
 * d'API exact n'est pas encore confirmé par l'équipe auth : seul ce port est
 * connu du reste du module, l'adaptateur réel le remplacera sans autre
 * changement.
 */
export type WhitelistEntry = { email: string; nom: string; prenom: string };

/** Identifiant du compte côté moteur d'auth (futur claim `sub`). */
export type PushedIdentity = { email: string; externalId: string };

export interface AuthEnginePort {
  pushWhitelist(entries: readonly WhitelistEntry[]): Promise<PushedIdentity[]>;
}

export class AuthEngineError extends Error {
  constructor(message = "Le moteur d'authentification est indisponible. Réessayez plus tard.") {
    super(message);
    this.name = "AuthEngineError";
  }
}
