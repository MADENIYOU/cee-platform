import { Button } from "@/components/ui/button";
import { fieldClass, labelClass } from "@/components/admin/formStyles";

/** Recherche par formulaire GET : l'URL porte la requête, aucun JavaScript requis. */
export function SearchForm({ action, label, defaultValue }: { action: string; label: string; defaultValue?: string }) {
  return (
    <form action={action} method="get" role="search" className="mb-4 flex flex-wrap items-end gap-3">
      <div className="min-w-56 flex-1">
        <label htmlFor="q" className={labelClass}>
          {label}
        </label>
        <input id="q" name="q" type="search" defaultValue={defaultValue} className={fieldClass} />
      </div>
      <Button type="submit" variant="outline">
        Rechercher
      </Button>
    </form>
  );
}
