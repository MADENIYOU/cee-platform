import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell/AppShell";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { AddStudentForm } from "@/components/admin/AddStudentForm";
import { resolvePageAccess } from "@/lib/admin/pageAccess";

export const metadata: Metadata = { title: "Ajouter un étudiant à ma classe — Plateforme CEE" };

/** Écran du responsable de classe : ajout d'un étudiant manquant, dans sa classe uniquement. */
export default async function AddStudentPage() {
  const access = await resolvePageAccess((session) => session.isResponsableClasse && !!session.classe);
  if (!access.ok || !access.session.classe) {
    return (
      <AppShell session={access.session}>
        <AccessDenied reason={access.ok ? "droits" : access.reason} />
      </AppShell>
    );
  }

  const { classe } = access.session;

  return (
    <AppShell session={access.session}>
      <h1 className="text-2xl font-semibold">Ajouter un étudiant à ma classe</h1>
      <p className="mb-6 mt-1 max-w-prose text-[var(--color-muted-foreground)]">
        L&apos;étudiant sera inscrit dans votre classe, <strong>{classe}</strong>. Vous ne pouvez pas modifier un
        compte existant, et chaque ajout est enregistré à votre nom.
      </p>
      <AddStudentForm classe={classe} />
    </AppShell>
  );
}
