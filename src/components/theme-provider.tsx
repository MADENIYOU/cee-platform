"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * Mode sombre : préférence système par défaut + toggle manuel (voir
 * components/app-shell/ThemeToggle.tsx). `attribute="data-theme"`
 * correspond aux sélecteurs définis dans globals.css.
 */
export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider attribute="data-theme" defaultTheme="system" enableSystem {...props}>
      {children}
    </NextThemesProvider>
  );
}
