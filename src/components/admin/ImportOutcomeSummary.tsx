import { Notice } from "@/components/admin/Notice";
import { RejectedLines } from "@/components/admin/RejectedLines";
import type { ImportReport, ImportStatus } from "@/lib/admin/import/report";

export const IMPORT_STATUS_LABELS: Record<ImportStatus, string> = {
  pending: "En cours",
  success: "Réussi",
  partial: "Succès partiel",
  failed: "Échec",
};

export function ImportOutcomeSummary({ status, report }: { status: ImportStatus; report: ImportReport }) {
  return (
    <section aria-labelledby="bilan-titre">
      <h2 id="bilan-titre" className="text-lg font-semibold">
        Bilan de l&apos;import : {IMPORT_STATUS_LABELS[status]}
      </h2>
      <Notice tone={status === "failed" ? "error" : "success"} className="mt-3">
        {report.created} compte{report.created > 1 ? "s" : ""} créé{report.created > 1 ? "s" : ""},{" "}
        {report.updated} mis à jour, {report.rejectedCount} ligne{report.rejectedCount > 1 ? "s" : ""}{" "}
        écartée{report.rejectedCount > 1 ? "s" : ""}. Les identités ont été transmises au moteur
        d&apos;authentification.
      </Notice>
      <RejectedLines lines={report.rejected} total={report.rejectedCount} />
    </section>
  );
}
