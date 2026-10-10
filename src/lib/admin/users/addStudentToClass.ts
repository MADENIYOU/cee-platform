import "server-only";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/logAudit";
import { AdminError } from "@/lib/admin/errors";
import { actorSnapshot, type ResponsableSession } from "@/lib/admin/guards";
import { describeRowError } from "@/lib/admin/import/rowErrors";
import { normalizeEmail, validateIdentity } from "@/lib/admin/import/validateRow";
import { upsertWhitelistedStudents } from "@/lib/admin/users/whitelistStore";

export type NewStudentInput = { nom: string; prenom: string; email: string };

/**
 * Ajout d'un étudiant manquant par un responsable de classe.
 *
 * Garde-fous (Plateforme_CEE_Fusion.md §2) :
 * - département, promo et classe viennent de la SESSION, jamais de la
 *   requête : impossible d'ajouter quelqu'un ailleurs que dans sa classe ;
 * - création seule : une adresse déjà connue est refusée, aucun droit sur
 *   les comptes existants ;
 * - chaque ajout est tracé.
 */
export async function addStudentToOwnClass(
  session: ResponsableSession,
  input: NewStudentInput
): Promise<{ id: string }> {
  const [firstError] = validateIdentity(input);
  if (firstError) throw new AdminError(422, describeRowError(firstError));

  const email = normalizeEmail(input.email);
  const alreadyKnown = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (alreadyKnown) {
    throw new AdminError(409, "Cette adresse est déjà inscrite. Aucune modification n'a été faite.");
  }

  await upsertWhitelistedStudents([
    {
      nom: input.nom.trim(),
      prenom: input.prenom.trim(),
      email,
      departement: session.departement,
      promo: session.promo,
      classe: session.classe,
    },
  ]);

  const created = await prisma.user.findUniqueOrThrow({ where: { email }, select: { id: true } });

  await logAudit({
    actorId: session.userId,
    actorNomSnapshot: actorSnapshot(session),
    action: "etudiant.ajoute",
    entity: "user",
    entityId: created.id,
    metadata: { classe: session.classe, departement: session.departement },
  });

  return created;
}
