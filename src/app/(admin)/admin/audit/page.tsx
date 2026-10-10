import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell/AppShell";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { AuditFilterForm } from "@/components/admin/AuditFilterForm";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/PageHeader";
import { Pagination } from "@/components/admin/Pagination";
import { parseAuditFilters } from "@/lib/admin/audit/auditFilters";
import { describeAudit } from "@/lib/admin/audit/describeAudit";
import { listAuditLogs, type AuditRow } from "@/lib/admin/audit/listAuditLogs";
import { formatDateTime } from "@/lib/admin/format";
import { isAdmin, resolvePageAccess } from "@/lib/admin/pageAccess";
import type { SearchParams } from "@/lib/admin/pagination";

export const metadata: Metadata = { title: "Journal d'audit — Plateforme CEE" };

// Règle n°4 : pas de cache, les admins voient les actions récentes tout de suite.
export const dynamic = "force-dynamic";

const COLUMNS: Column<AuditRow>[] = [
  { key: "date", header: "Quand", render: (row) => formatDateTime(row.createdAt) },
  {
    key: "acteur",
    header: "Qui",
    render: (row) => (
      <>
        {row.actorNom}
        {row.actorPurged && (
          <span className="block text-xs text-[var(--color-muted-foreground)]">Compte supprimé</span>
        )}
      </>
    ),
  },
  { key: "action", header: "Quoi", render: (row) => <span className="font-medium">{describeAudit(row).quoi}</span> },
  { key: "objet", header: "Sur quoi", render: (row) => describeAudit(row).objet },
  { key: "details", header: "Détails", render: (row) => describeAudit(row).details },
];

export default async function AuditPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const access = await resolvePageAccess(isAdmin);
  if (!access.ok) {
    return (
      <AppShell session={access.session}>
        <AccessDenied reason={access.reason} />
      </AppShell>
    );
  }

  const params = await searchParams;
  const logs = await listAuditLogs(parseAuditFilters(params));

  return (
    <AppShell session={access.session}>
      <PageHeader title="Journal d'audit" description="Toutes les actions enregistrées sur la plateforme : qui, quoi, quand." />
      <AuditFilterForm params={params} />
      <DataTable
        caption="Journal d'audit"
        columns={COLUMNS}
        rows={logs.rows}
        rowKey={(row) => row.id}
        emptyMessage="Aucune action ne correspond à ces filtres."
      />
      <Pagination basePath="/admin/audit" params={params} page={logs.page} pageCount={logs.pageCount} total={logs.total} />
    </AppShell>
  );
}
