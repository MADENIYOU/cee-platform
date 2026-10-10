import "server-only";
import { prisma } from "@/lib/prisma";
import { AdminError } from "@/lib/admin/errors";
import { AuthEngineError, getAuthEngine } from "@/lib/admin/auth-engine";
import type { ImportRow } from "@/lib/admin/import/validateRow";

export type UpsertSummary = { created: number; updated: number };

/** `ImportRow` en est un cas particulier (département et promo toujours renseignés). */
export type WhitelistedStudent = Pick<ImportRow, "nom" | "prenom" | "email" | "classe"> & {
  departement: string | null;
  promo: string | null;
};

/**
 * Inscrit des étudiants sur la liste blanche : poussée vers le moteur
 * d'auth, puis écriture du profil local. L'ADRESSE EST LA CLÉ — un compte
 * déjà connu est mis à jour, jamais dupliqué.
 *
 * Règle n°2 : l'appel sortant est encadré et son erreur mappée. Si la
 * poussée échoue, rien n'est écrit en base (pas d'état à moitié appliqué).
 */
export async function upsertWhitelistedStudents(
  rows: readonly WhitelistedStudent[]
): Promise<UpsertSummary> {
  if (rows.length === 0) return { created: 0, updated: 0 };

  let pushed;
  try {
    pushed = await getAuthEngine().pushWhitelist(
      rows.map(({ email, nom, prenom }) => ({ email, nom, prenom }))
    );
  } catch (error) {
    console.error("[whitelist] échec de la poussée vers le moteur d'auth", { error });
    throw new AdminError(502, new AuthEngineError().message);
  }
  const externalIds = new Map(pushed.map((identity) => [identity.email, identity.externalId]));

  const existing = await prisma.user.findMany({
    where: { email: { in: rows.map((row) => row.email) } },
    select: { email: true },
  });
  const known = new Set(existing.map((user) => user.email));

  const toUpdate = rows.filter((row) => known.has(row.email));
  const toCreate = rows.filter((row) => !known.has(row.email));

  await prisma.$transaction([
    ...toUpdate.map(({ email, ...profile }) =>
      prisma.user.update({ where: { email }, data: profile })
    ),
    prisma.user.createMany({
      data: toCreate.map((row) => ({ ...row, id: externalIds.get(row.email) })),
      // Filet de sécurité si deux lots concurrents portent la même adresse.
      skipDuplicates: true,
    }),
  ]);

  return { created: toCreate.length, updated: toUpdate.length };
}
