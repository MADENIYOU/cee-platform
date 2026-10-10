import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell/AppShell";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { IMPORT_STATUS_LABELS } from "@/components/admin/ImportOutcomeSummary";
import { ImportWizard } from "@/components/admin/ImportWizard";
import { PageHeader } from "@/components/admin/PageHeader";
import { formatDateTime } from "@/lib/admin/format";
import { listRecentImports } from "@/lib/admin/import/importService";
import { isAdmin, resolvePageAccess } from "@/lib/admin/pageAccess";

export const metadata: Metadata = { title: "Import de la liste blanche — Plateforme CEE" };

type ImportRecord = Awaited<ReturnType<typeof listRecentImports>>[number];

const COLUMNS: Column<ImportRecord>[] = [
  { key: "date", header: "Date", render: (row) => formatDateTime(row.createdAt) },
  { key: "source", header: "Source", render: (row) => row.batchSource.replace(/^departement:/, "") },
  { key: "statut", header: "Statut", render: (row) => IMPORT_STATUS_LABELS[row.status] },
  { key: "crees", header: "Créés", render: (row) => row.report.created },
  { key: "maj", header: "Mis à jour", render: (row) => row.report.updated },
  { key: "ecartes", header: "Écartés", render: (row) => row.report.rejectedCount },
];

export default async function ImportPage() {
  const access = await resolvePageAccess(isAdmin);
  if (!access.ok) {
    return (
      <AppShell session={access.session}>
        <AccessDenied reason={access.reason} />
      </AppShell>
    );
  }

  const imports = await listRecentImports();

  return (
    <AppShell session={access.session}>
      <PageHeader
        title="Import de la liste blanche"
        description="Importez le fichier d'une structure départementale. Un réimport met à jour les comptes existants, sans doublon."
      />
      <ImportWizard />

      <h2 className="mb-3 mt-10 text-lg font-semibold">Derniers imports</h2>
      <DataTable
        caption="Derniers imports de liste blanche"
        columns={COLUMNS}
        rows={imports}
        rowKey={(row) => row.id}
        emptyMessage="Aucun import pour le moment."
      />
    </AppShell>
  );
}
