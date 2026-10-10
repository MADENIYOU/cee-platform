"use client";

import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Panneau latéral accessible (focus trap, fermeture Échap/clic extérieur,
 * ARIA géré par Radix) — utilisé pour le menu Polyspace sur mobile
 * (bouton unique ouvrant la liste des applications, voir
 * Module_Fondations_Identite.md §6).
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-72 flex-col gap-4 border-r border-[var(--color-border)] bg-[var(--color-background)] p-4",
            "data-[state=open]:animate-in data-[state=open]:slide-in-from-left"
          )}
        >
          <Dialog.Title className="text-sm font-semibold">{title}</Dialog.Title>
          {children}
          <Dialog.Close asChild>
            <button
              className="absolute right-3 top-3 rounded-md p-1 text-sm hover:bg-[var(--color-muted)]"
              aria-label="Fermer le menu"
            >
              ✕
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
