/**
 * Filtrage de domaine email — exigence directe de l'équipe auth dédiée
 * (voir Authentification-CEE.md §2). Seuls ces domaines sont acceptés ;
 * tout le reste (ex. @ucad.edu.sn) est rejeté en 403.
 *
 * Implémenté côté applicatif, PAS par Keycloak — à nous de l'appliquer.
 */
export const ALLOWED_EMAIL_DOMAINS = ["esp.sn", "gmail.com"] as const;

export function isAllowedEmailDomain(email: string | null | undefined): boolean {
  if (!email) return false;
  const domain = email.split("@")[1]?.toLowerCase().trim();
  if (!domain) return false;
  return (ALLOWED_EMAIL_DOMAINS as readonly string[]).includes(domain);
}
