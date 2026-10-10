import Link from "next/link";
import { Button } from "@/components/ui/button";
import { fieldClass, labelClass } from "@/components/admin/formStyles";
import { AUDIT_ACTION_OPTIONS, AUDIT_ENTITY_OPTIONS } from "@/lib/admin/audit/describeAudit";
import { firstParam, type SearchParams } from "@/lib/admin/pagination";

type Option = { value: string; label: string };

function ChoiceField({
  name,
  label,
  allLabel,
  options,
  selected,
}: {
  name: string;
  label: string;
  allLabel: string;
  options: readonly Option[];
  selected?: string;
}) {
  // Un filtre venu de l'URL reste visible même s'il n'est pas dans la liste.
  const isKnown = !selected || options.some((option) => option.value === selected);
  return (
    <div>
      <label htmlFor={name} className={labelClass}>
        {label}
      </label>
      <select id={name} name={name} defaultValue={selected ?? ""} className={fieldClass}>
        <option value="">{allLabel}</option>
        {!isKnown && <option value={selected}>{selected}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function InputField({ name, label, type, params }: { name: string; label: string; type: "search" | "date"; params: SearchParams }) {
  return (
    <div>
      <label htmlFor={name} className={labelClass}>
        {label}
      </label>
      <input id={name} name={name} type={type} defaultValue={firstParam(params, name)} className={fieldClass} />
    </div>
  );
}

/** Filtres du journal d'audit, en langage courant, portés par l'URL (formulaire GET, sans JavaScript). */
export function AuditFilterForm({ params }: { params: SearchParams }) {
  return (
    <form action="/admin/audit" method="get" role="search" className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
      <InputField name="acteur" label="Qui" type="search" params={params} />
      <ChoiceField
        name="action"
        label="Quoi"
        allLabel="Toutes les actions"
        options={AUDIT_ACTION_OPTIONS}
        selected={firstParam(params, "action")}
      />
      <ChoiceField
        name="entity"
        label="Sur quoi"
        allLabel="Tout"
        options={AUDIT_ENTITY_OPTIONS}
        selected={firstParam(params, "entity")}
      />
      <InputField name="du" label="Du" type="date" params={params} />
      <InputField name="au" label="Au" type="date" params={params} />
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
