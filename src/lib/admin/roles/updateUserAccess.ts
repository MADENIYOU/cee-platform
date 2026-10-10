import "server-only";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/logAudit";
import { AdminError } from "@/lib/admin/errors";
import { actorSnapshot } from "@/lib/admin/guards";
import { checkAccessChange, diffRoles } from "@/lib/admin/roles/roleRules";
import type { AppRole, AppSession } from "@/types/session";

export type AccessInput = { roles: AppRole[]; isResponsableClasse: boolean };

/**
 * Attribue ou retire des droits d'administration et la permission
 * « responsable de classe ». Toute élévation ou tout retrait de privilège
 * laisse une ligne d'audit (Plateforme_CEE_Fusion.md §2).
 */
export async function updateUserAccess(
  session: AppSession,
  targetId: string,
  input: AccessInput
): Promise<AccessInput> {
  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) throw new AdminError(404, "Compte introuvable.");

  const before = target.roles as AppRole[];
  const change = diffRoles(before, input.roles);
  const permissionChanged = target.isResponsableClasse !== input.isResponsableClasse;
  if (change.added.length === 0 && change.removed.length === 0 && !permissionChanged) {
    return { roles: before, isResponsableClasse: target.isResponsableClasse };
  }

  const adminCount = await prisma.user.count({ where: { roles: { has: "admin" } } });
  const refusal = checkAccessChange({
    actorId: session.userId,
    targetId,
    targetClasse: target.classe,
    change,
    nextIsResponsableClasse: input.isResponsableClasse,
    adminCount,
  });
  if (refusal) throw new AdminError(409, refusal);

  const roles = [...before.filter((role) => !change.removed.includes(role)), ...change.added];
  await prisma.user.update({
    where: { id: targetId },
    data: { roles, isResponsableClasse: input.isResponsableClasse },
  });

  const audit = (action: string, metadata: Record<string, unknown>) =>
    logAudit({
      actorId: session.userId,
      actorNomSnapshot: actorSnapshot(session),
      action,
      entity: "user",
      entityId: targetId,
      metadata: { cible: `${target.prenom} ${target.nom}`.trim(), ...metadata },
    });

  for (const role of change.added) await audit("role.attribue", { role, avant: before, apres: roles });
  for (const role of change.removed) await audit("role.retire", { role, avant: before, apres: roles });
  if (permissionChanged) {
    await audit(
      input.isResponsableClasse ? "permission.responsable_classe.attribuee" : "permission.responsable_classe.retiree",
      { classe: target.classe }
    );
  }

  return { roles, isResponsableClasse: input.isResponsableClasse };
}
