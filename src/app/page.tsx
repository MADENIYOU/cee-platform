import { AppShell } from "@/components/app-shell/AppShell";
import { getSession } from "@/lib/auth/session";

/**
 * Page d'accueil du Module 1 : statut minimal, sert surtout à vérifier
 * que le socle (auth, layout, Polyspace, mode sombre) fonctionne de bout
 * en bout. Le vrai contenu de la vitrine est construit par le Module 2.
 */
export default async function HomePage() {
  const session = await getSession();

  return (
    <AppShell session={session}>
      <h1 className="text-2xl font-semibold">Plateforme CEE</h1>
      <p className="mt-2 text-[var(--color-muted-foreground)]">
        Module 1 — Fondations & Identité. Le contenu de la vitrine (annonces,
        présentation, événements) sera livré par le Module 2.
      </p>

      {session ? (
        <div className="mt-6 rounded-md border border-[var(--color-border)] p-4">
          <p>
            Connecté·e en tant que <strong>{session.prenom} {session.nom}</strong> ({session.email})
          </p>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Rôles : {session.roles.length > 0 ? session.roles.join(", ") : "aucun (étudiant)"}
          </p>
        </div>
      ) : (
        <p className="mt-6 text-sm text-[var(--color-muted-foreground)]">
          Non connecté·e — utilisez le bouton « Se connecter avec Google » en haut de la page.
        </p>
      )}
    </AppShell>
  );
}
