import Link from "next/link";
import type { SearchParams } from "@/lib/admin/pagination";

function hrefForPage(basePath: string, params: SearchParams, page: number): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (first && key !== "page") query.set(key, first);
  }
  if (page > 1) query.set("page", String(page));
  const search = query.toString();
  return search ? `${basePath}?${search}` : basePath;
}

/** Pagination par liens : conserve les filtres de l'URL, fonctionne sans JavaScript. */
export function Pagination({
  basePath,
  params,
  page,
  pageCount,
  total,
}: {
  basePath: string;
  params: SearchParams;
  page: number;
  pageCount: number;
  total: number;
}) {
  const linkClass = "rounded-md border border-[var(--color-border)] px-3 py-2 hover:bg-[var(--color-muted)]";

  return (
    <nav aria-label="Pagination" className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-[var(--color-muted-foreground)]">
        Page {page} sur {pageCount} — {total} résultat{total > 1 ? "s" : ""}
      </p>
      <div className="flex gap-2">
        {page > 1 && (
          <Link href={hrefForPage(basePath, params, page - 1)} className={linkClass} rel="prev">
            Précédent
          </Link>
        )}
        {page < pageCount && (
          <Link href={hrefForPage(basePath, params, page + 1)} className={linkClass} rel="next">
            Suivant
          </Link>
        )}
      </div>
    </nav>
  );
}
