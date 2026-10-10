"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

/**
 * Barre de navigation Polyspace — exigence transverse de l'écosystème CEE,
 * pas optionnelle (voir Module_Fondations_Identite.md §6 et
 * Reunion_Design_System_2026-10-03.md).
 *
 * - Desktop : barre verticale rétractable, logos des apps de l'écosystème,
 *   app active en surbrillance.
 * - Mobile : un bouton unique ouvre la liste des applications.
 *
 * Implémentation isolée ici (liste de logos en donnée séparée) pour
 * pouvoir basculer facilement vers un composant partagé si l'écosystème
 * en fournit un plus tard — débat non tranché côté Design System.
 */
type PolyspaceApp = {
  id: string;
  name: string;
  href: string;
  /** Placeholder tant que les vrais logos ne sont pas fournis par chaque équipe. */
  initial: string;
};

const POLYSPACE_APPS: PolyspaceApp[] = [
  { id: "cee-platform", name: "Plateforme CEE", href: "/", initial: "CE" },
  { id: "hints", name: "Hints", href: "#", initial: "HI" },
  { id: "vote", name: "Vote", href: "#", initial: "VO" },
  { id: "guide-logiciels", name: "Guide Logiciels", href: "#", initial: "GL" },
];

export function PolyspaceBar({ activeAppId = "cee-platform" }: { activeAppId?: string }) {
  const [retracted, setRetracted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile : bouton unique */}
      <div className="flex items-center border-b border-[var(--color-border)] p-2 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Ouvrir les applications du Polyspace"
          onClick={() => setMobileOpen(true)}
        >
          <PolyspaceIcon />
        </Button>
      </div>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen} title="Applications">
        <nav aria-label="Applications de l'écosystème CEE">
          <ul className="flex flex-col gap-1">
            {POLYSPACE_APPS.map((app) => (
              <PolyspaceAppLink key={app.id} app={app} active={app.id === activeAppId} />
            ))}
          </ul>
        </nav>
      </Sheet>

      {/* Desktop : barre verticale rétractable */}
      <nav
        aria-label="Applications de l'écosystème CEE"
        className={`hidden md:flex md:flex-col md:gap-1 md:border-r md:border-[var(--color-border)] md:p-2 md:transition-all ${
          retracted ? "md:w-14" : "md:w-56"
        }`}
      >
        <Button
          variant="ghost"
          size="icon"
          className="self-end"
          aria-label={retracted ? "Déplier le Polyspace" : "Replier le Polyspace"}
          onClick={() => setRetracted((value) => !value)}
        >
          <PolyspaceIcon />
        </Button>
        <ul className="flex flex-col gap-1">
          {POLYSPACE_APPS.map((app) => (
            <PolyspaceAppLink
              key={app.id}
              app={app}
              active={app.id === activeAppId}
              compact={retracted}
            />
          ))}
        </ul>
      </nav>
    </>
  );
}

function PolyspaceAppLink({
  app,
  active,
  compact,
}: {
  app: PolyspaceApp;
  active: boolean;
  compact?: boolean;
}) {
  return (
    <li>
      <a
        href={app.href}
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-2 rounded-md p-2 text-sm hover:bg-[var(--color-muted)] ${
          active ? "bg-[var(--color-muted)] font-medium" : ""
        }`}
        title={app.name}
      >
        <span
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--color-primary)] text-xs font-bold text-[var(--color-primary-foreground)]"
        >
          {app.initial}
        </span>
        {!compact && <span className="truncate">{app.name}</span>}
      </a>
    </li>
  );
}

function PolyspaceIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="6" height="6" rx="1" fill="currentColor" />
      <rect x="12" y="2" width="6" height="6" rx="1" fill="currentColor" />
      <rect x="2" y="12" width="6" height="6" rx="1" fill="currentColor" />
      <rect x="12" y="12" width="6" height="6" rx="1" fill="currentColor" />
    </svg>
  );
}
