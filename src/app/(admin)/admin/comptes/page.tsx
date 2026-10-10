import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/app-shell/AppShell";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/PageHeader";
import { Pagination } from "@/components/admin/Pagination";
import { SearchForm } from "@/components/admin/SearchForm";
import { isAdmin, resolvePageAccess } from "@/lib/admin/pageAccess";
import { firstParam, parsePage, type SearchParams } from "@/lib/admin/pagination";
import { ROLE_LABELS } from "@/lib/admin/roles/roleRules";
import { listUsers, type UserRow } from "@/lib/admin/users/listUsers";

export const metadata: Metadata = { title: "Comptes — Plateforme CEE" };

const COLUMNS: Column<UserRow>[] = [
  { key: "nom", header: "Nom", render: (row) => `${row.prenom} ${row.nom}` },
  { key: "email", header: "Email", render: (row) => row.email },
  { key: "departement", header: "Département", render: (row) => row.departement ?? "—" },
  { key: "classe", header: "Classe", render: (row) => [row.classe, row.promo].filter(Boolean).join(" · ") || "—" },
  {
    key: "droits",
    header: "Droits",
    render: (row) =>
      [...row.roles.map((role) => ROLE_LABELS[role]), ...(row.isResponsableClasse ? ["Responsable de classe"] : [])].join(
        ", "
      ) || "Étudiant",
  },
];

export default async function AccountsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const access = await resolvePageAccess(isAdmin);
  if (!access.ok) {
    return (
      <AppShell session={access.session}>
        <AccessDenied reason={access.reason} />
      </AppShell>
    );
  }

  const params = await searchParams;
  const q = firstParam(params, "q");
  const users = await listUsers({ q, page: parsePage(firstParam(params, "page")) });

  return (
    <AppShell session={access.session}>
      <PageHeader
        title="Comptes"
        description="Comptes inscrits sur la liste blanche."
        actions={
          <Link href="/admin/comptes/import" className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm hover:bg-[var(--color-muted)]">
            Importer un fichier
          </Link>
        }
      />
      <SearchForm action="/admin/comptes" label="Rechercher par nom, prénom ou adresse" defaultValue={q} />
      <DataTable
        caption="Comptes de la liste blanche"
        columns={COLUMNS}
        rows={users.rows}
        rowKey={(row) => row.id}
        emptyMessage={q ? "Aucun compte ne correspond à cette recherche." : "Aucun compte pour le moment."}
      />
      <Pagination basePath="/admin/comptes" params={params} page={users.page} pageCount={users.pageCount} total={users.total} />
    </AppShell>
  );
}
