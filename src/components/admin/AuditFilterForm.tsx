import Link from "next/link";
import { Button } from "@/components/ui/button";
import { fieldClass, labelClass } from "@/components/admin/formStyles";
import { firstParam, type SearchParams } from "@/lib/admin/pagination";

const FIELDS = [
  { name: "acteur", label: "Acteur", type: "search" },
  { name: "action", label: "Action", type: "search" },
  { name: "entity", label: "Objet", type: "search" },
  { name: "du", label: "Du", type: "date" },
  { name: "au", label: "Au", type: "date" },
] as const;

/** Filtres du journal d'audit, portés par l'URL (formulaire GET, sans JavaScript). */
export function AuditFilterForm({ params }: { params: SearchParams }) {
  return (
    <form action="/admin/audit" method="get" role="search" className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
      {FIELDS.map((field) => (
        <div key={field.name}>
          <label htmlFor={field.name} className={labelClass}>
            {field.label}
          </label>
          <input
            id={field.name}
            name={field.name}
            type={field.type}
            defaultValue={firstParam(params, field.name)}
            className={fieldClass}
          />
        </div>
      ))}
      <div className="flex items-end gap-2">
        <Button type="submit" variant="outline">
          Filtrer
        </Button>
        <Link href="/admin/audit" className="px-2 py-2 text-sm underline">
          Effacer
        </Link>
      </div>
    </form>
  );
}
