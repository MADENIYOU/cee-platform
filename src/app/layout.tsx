import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plateforme CEE",
  description: "Plateforme numérique officielle du Comité Exécutif des Étudiants — ESP Dakar",
  manifest: "/manifest.webmanifest",
};

// Mobile-first obligatoire (voir Plateforme_CEE_Fusion.md §6) :
// viewport explicite, pas de zoom désactivé (accessibilité).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
