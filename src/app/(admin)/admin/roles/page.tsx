import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell/AppShell";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/PageHeader";
import { Pagination } from "@/components/admin/Pagination";
import { RoleEditor } from "@/components/admin/RoleEditor";
import { SearchForm } from "@/components/admin/SearchForm";
import { isAdmin, resolvePageAccess } from "@/lib/admin/pageAccess";
import { firstParam, parsePage, type SearchParams } from "@/lib/admin/pagination";
import { listUsers, type UserRow } from "@/lib/admin/users/listUsers";

export const metadata: Metadata = { title: "Gestion des rôles — Plateforme CEE" };

const COLUMNS: Column<UserRow>[] = [
  {
    key: "compte",
    header: "Compte",
    render: (row) => (
      <>
        <span className="font-medium">
          {row.prenom} {row.nom}
        </span>
        <span className="block text-[var(--color-muted-foreground)]">{row.email}</span>
      </>
    ),
  },
  { key: "classe", header: "Classe", render: (row) => row.classe ?? "—" },
  {
    key: "droits",
    header: "Droits",
    render: (row) => (
      <RoleEditor
        userId={row.id}
        userName={`${row.prenom} ${row.nom}`}
        initial={{ roles: row.roles, isResponsableClasse: row.isResponsableClasse }}
        canBeResponsable={row.classe !== null}
      />
    ),
  },
];

export default async function RolesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
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
        title="Gestion des rôles"
        description="Attribuez ou retirez les droits Éditeur, Modérateur et Admin. Chaque changement est inscrit au journal d'audit."
      />
      <SearchForm action="/admin/roles" label="Rechercher un compte" defaultValue={q} />
      <DataTable
        caption="Droits des comptes"
        columns={COLUMNS}
        rows={users.rows}
        rowKey={(row) => row.id}
        emptyMessage={q ? "Aucun compte ne correspond à cette recherche." : "Aucun compte pour le moment."}
      />
      <Pagination basePath="/admin/roles" params={params} page={users.page} pageCount={users.pageCount} total={users.total} />
    </AppShell>
  );
}
