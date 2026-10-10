import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { pageOffset, toPage, type Page } from "@/lib/admin/pagination";
import type { AppRole } from "@/types/session";

export type UserRow = {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  departement: string | null;
  classe: string | null;
  promo: string | null;
  roles: AppRole[];
  isResponsableClasse: boolean;
};

const USER_COLUMNS = {
  id: true,
  email: true,
  nom: true,
  prenom: true,
  departement: true,
  classe: true,
  promo: true,
  roles: true,
  isResponsableClasse: true,
} satisfies Prisma.UserSelect;

/** Comptes de la liste blanche, paginés, avec recherche sur nom, prénom et adresse. */
export async function listUsers(query: { q?: string; page: number }): Promise<Page<UserRow>> {
  const contains = query.q ? { contains: query.q, mode: "insensitive" as const } : undefined;
  const where: Prisma.UserWhereInput = contains
    ? { OR: [{ nom: contains }, { prenom: contains }, { email: contains }] }
    : {};

  const [records, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: USER_COLUMNS,
      orderBy: [{ nom: "asc" }, { prenom: "asc" }, { id: "asc" }],
      ...pageOffset(query.page),
    }),
    prisma.user.count({ where }),
  ]);

  const rows = records.map((user) => ({ ...user, roles: user.roles as AppRole[] }));
  return toPage(rows, total, query.page);
}
