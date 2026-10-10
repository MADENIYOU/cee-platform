import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { pageOffset, toPage, type Page } from "@/lib/admin/pagination";
import type { AuditFilters } from "@/lib/admin/audit/auditFilters";

export type AuditRow = {
  id: string;
  createdAt: Date;
  /** Instantané écrit au moment de l'action — seule source du nom affiché. */
  actorNom: string;
  /** `true` si le compte de l'acteur n'existe plus (purge Keycloak). */
  actorPurged: boolean;
  action: string;
  entity: string;
  entityId: string;
  metadata: Prisma.JsonValue | null;
};

/**
 * Journal d'audit transverse, paginé côté serveur.
 *
 * AUCUNE jointure sur `core.users` : le nom vient de `actor_nom_snapshot`,
 * ce qui garde chaque ligne lisible après la purge d'un compte
 * (Module_Administration_Comptes.md §5).
 */
export async function listAuditLogs(filters: AuditFilters): Promise<Page<AuditRow>> {
  const where: Prisma.AuditLogWhereInput = {
    ...(filters.action && { action: { contains: filters.action, mode: "insensitive" } }),
    ...(filters.entity && { entity: filters.entity }),
    ...(filters.acteur && { actorNomSnapshot: { contains: filters.acteur, mode: "insensitive" } }),
    ...((filters.du || filters.au) && { createdAt: { gte: filters.du, lte: filters.au } }),
  };

  const [records, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      ...pageOffset(filters.page),
    }),
    prisma.auditLog.count({ where }),
  ]);

  const rows = records.map((record) => ({
    id: record.id,
    createdAt: record.createdAt,
    actorNom: record.actorNomSnapshot,
    actorPurged: record.actorId === null,
    action: record.action,
    entity: record.entity,
    entityId: record.entityId,
    metadata: record.metadata,
  }));
  return toPage(rows, total, filters.page);
}
