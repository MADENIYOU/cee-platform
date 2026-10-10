import { Button } from "@/components/ui/button";
import { signInAction } from "@/lib/auth/actions";

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied:
    "Connexion refusée : seules les adresses @esp.sn et @gmail.com sont autorisées.",
  Default: "Une erreur est survenue lors de la connexion. Réessayez.",
};

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message = error ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default) : null;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-xl font-semibold">Connexion — Plateforme CEE</h1>

      {message && (
        <p
          role="alert"
          className="max-w-sm text-center text-sm text-[var(--color-danger)]"
        >
          {message}
        </p>
      )}

      <form action={signInAction}>
        <Button type="submit">Se connecter avec Google</Button>
      </form>
    </main>
  );
}
