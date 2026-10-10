import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const TONES = {
  info: "border-[var(--color-border)] bg-[var(--color-muted)]",
  success: "border-[var(--color-primary)]",
  error: "border-[var(--color-danger)] text-[var(--color-danger)]",
} as const;

/**
 * Message d'état (retour d'action, erreur, information). Les erreurs sont
 * annoncées immédiatement aux lecteurs d'écran, le reste poliment.
 */
export function Notice({
  tone = "info",
  children,
  className,
}: {
  tone?: keyof typeof TONES;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("rounded-md border p-3 text-sm", TONES[tone], className)}
    >
      {children}
    </div>
  );
}
