import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { pageOffset, toPage, type Page } from "@/lib/admin/pagination";
import type { UserFilters } from "@/lib/admin/users/userFilters";
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

/**
 * Comptes de la liste blanche, paginés. Recherche libre sur nom, prénom et
 * email ; filtres exacts sur le département et la classe.
 */
export async function listUsers(filters: UserFilters): Promise<Page<UserRow>> {
  const contains = filters.q ? { contains: filters.q, mode: "insensitive" as const } : undefined;
  const where: Prisma.UserWhereInput = {
    ...(contains && { OR: [{ nom: contains }, { prenom: contains }, { email: contains }] }),
    ...(filters.departement && { departement: filters.departement }),
    ...(filters.classe && { classe: filters.classe }),
  };

  const [records, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: USER_COLUMNS,
      orderBy: [{ nom: "asc" }, { prenom: "asc" }, { id: "asc" }],
      ...pageOffset(filters.page),
    }),
    prisma.user.count({ where }),
  ]);

  const rows = records.map((user) => ({ ...user, roles: user.roles as AppRole[] }));
  return toPage(rows, total, filters.page);
}

export type UserFacets = { departements: string[]; classes: string[] };

/**
 * Valeurs proposées dans les filtres : celles réellement présentes en base,
 * pour ne jamais proposer un département ou une classe sans aucun compte.
 */
export async function listUserFacets(): Promise<UserFacets> {
  const [departements, classes] = await prisma.$transaction([
    prisma.user.findMany({
      where: { departement: { not: null } },
      distinct: ["departement"],
      select: { departement: true },
      orderBy: { departement: "asc" },
    }),
    prisma.user.findMany({
      where: { classe: { not: null } },
      distinct: ["classe"],
      select: { classe: true },
      orderBy: { classe: "asc" },
    }),
  ]);
  return {
    departements: departements.flatMap((row) => (row.departement ? [row.departement] : [])),
    classes: classes.flatMap((row) => (row.classe ? [row.classe] : [])),
  };
}
