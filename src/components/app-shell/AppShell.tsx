/**
 * MOCK — remplacé par le Module 1 à l'intégration.
 *
 * Layout minimal temporaire, avec la même signature que le vrai
 * `<AppShell>` (Module_Fondations_Identite.md §2) : header/footer communs,
 * barre Polyspace, menu par rôle et mode sombre arriveront avec lui, sans
 * rien changer aux pages du Module 5.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import type { AppSession } from "@/types/session";

export async function AppShell({
  children,
  session: sessionProp,
}: {
  children: ReactNode;
  session?: AppSession | null;
}) {
  const session = sessionProp !== undefined ? sessionProp : await getSession();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)] p-4">
        <div className="flex items-center gap-4">
          <span className="font-semibold">Plateforme CEE</span>
          <nav aria-label="Navigation principale">
            <Link href="/admin" className="text-sm hover:underline">
              Tableau de bord
            </Link>
          </nav>
        </div>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {session ? `${session.prenom} ${session.nom} (session de test)` : "Non connecté·e"}
        </p>
      </header>
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
