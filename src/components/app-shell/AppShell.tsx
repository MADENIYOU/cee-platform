import type { ReactNode } from "react";
import { getSession } from "@/lib/auth/session";
import { PolyspaceBar } from "@/components/app-shell/PolyspaceBar";
import { Header } from "@/components/app-shell/Header";
import { Footer } from "@/components/app-shell/Footer";
import type { AppSession } from "@/types/session";

/**
 * Composant de layout exposé aux modules 2 à 5 (voir
 * Module_Fondations_Identite.md §2) : header/footer communs, barre
 * Polyspace, menu bifurqué par rôle, mode sombre. Les autres modules
 * n'ont jamais à recoder la navigation — ils enveloppent juste leur
 * contenu : `<AppShell>{children}</AppShell>`.
 *
 * Appelle `getSession()` lui-même (mémoïsée par React `cache()`, donc
 * gratuite si l'appelant l'a déjà lue dans le même rendu) — un `session`
 * explicite peut être passé pour éviter une lecture redondante.
 */
export async function AppShell({
  children,
  session: sessionProp,
}: {
  children: ReactNode;
  session?: AppSession | null;
}) {
  const session = sessionProp !== undefined ? sessionProp : await getSession();

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <PolyspaceBar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header session={session} />
        <main className="flex-1 p-4">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
