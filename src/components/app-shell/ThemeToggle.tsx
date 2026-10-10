"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

/** Toggle mode sombre : préférence système par défaut, override manuel. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Évite un flash de contenu incohérent entre le rendu serveur et client
  // (le thème réel n'est connu qu'après hydratation) — pattern recommandé
  // par la documentation officielle de next-themes. La nouvelle règle
  // react-hooks/set-state-in-effect le signale, mais ce cas précis est
  // sûr : un seul set, sans boucle de rendu en cascade possible.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <Button variant="ghost" size="icon" aria-hidden="true" disabled />;
  }

  const isDark = theme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? "☀️" : "🌙"}
    </Button>
  );
}
