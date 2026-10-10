import { PrismaClient } from "@prisma/client";

/**
 * Singleton Prisma Client. En dev, Next.js recharge les modules à chaud
 * (Fast Refresh) : sans ce pattern, chaque rechargement ouvrirait une
 * nouvelle connexion DB jusqu'à épuiser le pool.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
