import type { ReactNode } from "react";
import Link from "next/link";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6">
      <Link href="/admin" className="text-sm text-[var(--color-muted-foreground)] hover:underline">
        ← Tableau de bord
      </Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          {description && <p className="mt-1 text-[var(--color-muted-foreground)]">{description}</p>}
        </div>
        {actions}
      </div>
    </div>
  );
}
