import type { MetadataRoute } from "next";

/**
 * Manifest PWA — icônes en placeholder jusqu'au vrai logo CEE (action en
 * cours, voir Module_Fondations_Identite.md §6 et registre §12).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Plateforme CEE",
    short_name: "CEE",
    description: "Plateforme numérique officielle du Comité Exécutif des Étudiants — ESP Dakar",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1d4ed8",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
