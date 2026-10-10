import Link from "next/link";
import { Button } from "@/components/ui/button";
import { fieldClass, labelClass } from "@/components/admin/formStyles";
import type { UserFacets } from "@/lib/admin/users/listUsers";
import type { UserFilters } from "@/lib/admin/users/userFilters";

function FacetSelect({
  name,
  label,
  allLabel,
  options,
  selected,
}: {
  name: string;
  label: string;
  allLabel: string;
  options: readonly string[];
  selected?: string;
}) {
  // Un filtre venu de l'URL reste visible même s'il ne correspond plus à aucun compte.
  const choices = selected && !options.includes(selected) ? [selected, ...options] : options;
  return (
    <div>
      <label htmlFor={name} className={labelClass}>
        {label}
      </label>
      <select id={name} name={name} defaultValue={selected ?? ""} className={fieldClass}>
        <option value="">{allLabel}</option>
        {choices.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Recherche et filtres des comptes, portés par l'URL (formulaire GET, sans
 * JavaScript). Soumettre revient toujours à la première page.
 */
export function UserFilterForm({
  action,
  filters,
  facets,
}: {
  action: string;
  filters: UserFilters;
  facets: UserFacets;
}) {
  return (
    <form action={action} method="get" role="search" className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <label htmlFor="q" className={labelClass}>
          Nom, prénom ou email
        </label>
        <input id="q" name="q" type="search" defaultValue={filters.q} className={fieldClass} />
      </div>
      <FacetSelect
        name="departement"
        label="Département"
        allLabel="Tous les départements"
        options={facets.departements}
        selected={filters.departement}
      />
      <FacetSelect
        name="classe"
        label="Classe"
        allLabel="Toutes les classes"
        options={facets.classes}
        selected={filters.classe}
      />
      <div className="flex items-end gap-2">
        <Button type="submit" variant="outline">
          Filtrer
        </Button>
        <Link href={action} className="px-2 py-2 text-sm underline">
          Effacer
        </Link>
      </div>
    </form>
  );
}
