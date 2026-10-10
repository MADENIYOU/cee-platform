"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * État « erreur » commun aux écrans d'administration (règles n°1 et n°9) :
 * un message lisible et une relance manuelle, jamais la stack.
 */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[admin] erreur d'affichage", error.digest ?? error.message);
  }, [error]);

  return (
    <div role="alert" className="mx-auto max-w-prose p-4">
      <h1 className="text-2xl font-semibold">Impossible d&apos;afficher cette page</h1>
      <p className="mt-2 text-[var(--color-muted-foreground)]">
        Les données n&apos;ont pas pu être chargées. Vos actions précédentes ne sont pas perdues.
      </p>
      <Button className="mt-4" onClick={reset}>
        Réessayer
      </Button>
    </div>
  );
}
