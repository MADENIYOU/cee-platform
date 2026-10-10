import type { AppSession } from "@/types/session";
import { RoleNav } from "@/components/app-shell/RoleNav";
import { ThemeToggle } from "@/components/app-shell/ThemeToggle";
import { Button } from "@/components/ui/button";
import { signInAction, signOutAction } from "@/lib/auth/actions";

export function Header({ session }: { session: AppSession | null }) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] p-4">
      <div className="flex items-center gap-4">
        <span className="font-semibold">Plateforme CEE</span>
        <RoleNav roles={session?.roles ?? []} />
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {session ? (
          <form action={signOutAction}>
            <Button variant="outline" size="default" type="submit">
              Déconnexion
            </Button>
          </form>
        ) : (
          <form action={signInAction}>
            <Button variant="default" size="default" type="submit">
              Se connecter avec Google
            </Button>
          </form>
        )}
      </div>
    </header>
  );
}
