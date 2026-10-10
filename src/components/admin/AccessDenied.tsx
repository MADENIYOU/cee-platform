import Link from "next/link";

const MESSAGES = {
  connexion: "Connectez-vous pour accéder à cette page.",
  droits: "Votre compte n'a pas les droits nécessaires pour cette page.",
} as const;

export function AccessDenied({ reason }: { reason: keyof typeof MESSAGES }) {
  return (
    <section aria-labelledby="acces-refuse" className="mx-auto max-w-prose py-8">
      <h1 id="acces-refuse" className="text-2xl font-semibold">
        Accès refusé
      </h1>
      <p className="mt-2 text-[var(--color-muted-foreground)]">{MESSAGES[reason]}</p>
      {reason === "droits" && (
        <p className="mt-4">
          <Link href="/admin" className="underline">
            Retour au tableau de bord
          </Link>
        </p>
      )}
    </section>
  );
}
