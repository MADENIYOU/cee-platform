import "server-only";
import { prisma } from "@/lib/prisma";

export type AuditEntry = {
  /** UUID Keycloak de l'acteur. Peut devenir orphelin après une purge. */
  actorId: string | null;
  /**
   * Nom/prénom de l'acteur AU MOMENT de l'action. Ne jamais recalculer
   * depuis `users` à l'affichage — c'est ce qui garde le journal lisible
   * après une purge Keycloak (voir Module_Fondations_Identite.md §5).
   */
  actorNomSnapshot: string;
  /** ex. "annonce.publiee", "signalement.traite", "role.attribue" */
  action: string;
  /** ex. "annonce", "post", "user" */
  entity: string;
  entityId: string;
  metadata?: Record<string, unknown>;
};

/**
 * Enregistre une ligne d'audit. Append-only : jamais d'update/delete sur
 * cette table depuis le code applicatif. Utilisé par tous les modules.
 *
 * Règle d'ingénierie n°2 (try/catch/finally) : une erreur d'audit ne doit
 * jamais faire échouer l'action métier qu'elle journalise — elle est
 * loggée côté serveur pour investigation, mais l'appelant ne doit pas
 * planter dessus.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: entry.actorId,
        actorNomSnapshot: entry.actorNomSnapshot,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        metadata: entry.metadata ? JSON.parse(JSON.stringify(entry.metadata)) : undefined,
      },
    });
  } catch (error) {
    // Erreur mappée (règle n°9) : on ne relance jamais une erreur brute,
    // et on ne bloque jamais l'action métier appelante sur un échec d'audit.
    console.error("[logAudit] échec d'écriture du journal d'audit", {
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId,
      error,
    });
  } finally {
    // Point d'extension futur : métriques (ex. compteur d'échecs d'audit).
  }
}
