import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/app-shell/AppShell";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { getDashboardItems } from "@/lib/admin/dashboardItems";
import { hasAdminAccess } from "@/lib/admin/guards";
import { resolvePageAccess } from "@/lib/admin/pageAccess";

export const metadata: Metadata = { title: "Tableau de bord — Plateforme CEE" };

/** Accueil de l'administration : uniquement les fonctions des rôles de la personne. */
export default async function AdminDashboardPage() {
  const access = await resolvePageAccess((session) => hasAdminAccess(session) || session.isResponsableClasse);
  if (!access.ok) {
    return (
      <AppShell session={access.session}>
        <AccessDenied reason={access.reason} />
      </AppShell>
    );
  }

  const items = getDashboardItems(access.session);

  return (
    <AppShell session={access.session}>
      <h1 className="text-2xl font-semibold">Tableau de bord</h1>
      <p className="mt-1 text-[var(--color-muted-foreground)]">
        Bonjour {access.session.prenom}. Voici les fonctions liées à vos droits.
      </p>

      {items.length === 0 ? (
        <p className="mt-6 text-[var(--color-muted-foreground)]">Aucune fonction n&apos;est disponible pour votre compte.</p>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="block h-full rounded-md border border-[var(--color-border)] p-4 hover:bg-[var(--color-muted)]"
              >
                <span className="font-medium">{item.label}</span>
                <span className="mt-1 block text-sm text-[var(--color-muted-foreground)]">{item.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
