import { pool } from "@/lib/db/pool";
import type { Session } from "@/lib/mocks/module1";

export type ListParams = {
  session: Session;
  q?: string;
  tag?: string;
  page: number;
  pageSize: number;
};

export async function listAnnonces({ session, q, tag, page, pageSize }: ListParams) {
  const where: string[] = [
    "statut = 'publié'",
    "(date_expiration IS NULL OR date_expiration > now())",
  ];
  const params: unknown[] = [];
  const add = (v: unknown) => {
    params.push(v);
    return `$${params.length}`;
  };

  if (!session) {
    // Visiteur : public uniquement, sans ciblage
    where.push("visibilite = 'publique'", "departement_cible IS NULL", "classe_cible IS NULL");
  } else {
    const dep = add(session.departement);
    const cl = add(session.classe);
    where.push(`(departement_cible IS NULL OR departement_cible = ${dep})`);
    where.push(`(classe_cible IS NULL OR classe_cible = ${cl})`);
  }

  if (q) {
    const p = add(`%${q}%`);
    where.push(`(titre ILIKE ${p} OR corps ILIKE ${p})`);
  }
  if (tag) where.push(`${add(tag)} = ANY(tags)`);

  const whereSql = where.join(" AND ");

  const countRes = await pool.query(
    `SELECT count(*)::int AS total FROM diffusion.annonces WHERE ${whereSql}`,
    params
  );

  const limit = add(pageSize);
  const offset = add((page - 1) * pageSize);

  const rows = await pool.query(
    `SELECT id, titre, left(corps, 200) AS extrait, tags, visibilite, epingle, created_at
     FROM diffusion.annonces
     WHERE ${whereSql}
     ORDER BY epingle DESC, created_at DESC
     LIMIT ${limit} OFFSET ${offset}`,
    params
  );

  return {
    items: rows.rows,
    total: countRes.rows[0].total as number,
    page,
    pageSize,
  };
}
