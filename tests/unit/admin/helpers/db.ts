import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { AppSession } from "@/types/session";

/**
 * Tests d'intégration du Module 5 : nécessitent une vraie PostgreSQL
 * (DATABASE_URL), comme `purge-resilience.test.ts` du Module 1. Ignorés
 * automatiquement sinon.
 *
 * Chaque fichier de test travaille sous son propre préfixe, pour pouvoir
 * tourner en parallèle sur la même base sans se marcher dessus.
 */
export const hasDatabase = !!process.env.DATABASE_URL;

export function testEmail(prefix: string, name: string): string {
  return `${prefix}.${name}@esp.sn`;
}

/** Crée un compte en base et renvoie la session correspondante. */
export async function createSessionUser(
  prefix: string,
  name: string,
  overrides: Partial<AppSession> = {}
): Promise<AppSession> {
  const session: AppSession = {
    userId: randomUUID(),
    email: testEmail(prefix, name),
    nom: prefix,
    prenom: name,
    departement: "Génie Informatique",
    classe: "DIC1",
    promo: "2027",
    roles: [],
    isResponsableClasse: false,
    ...overrides,
  };
  const { userId, ...profile } = session;
  await prisma.user.create({ data: { id: userId, ...profile } });
  return session;
}

export async function cleanup(prefix: string): Promise<void> {
  await prisma.auditLog.deleteMany({ where: { actorNomSnapshot: { contains: prefix } } });
  await prisma.whitelistImport.deleteMany({ where: { batchSource: { contains: prefix } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: `${prefix}.` } } });
}
