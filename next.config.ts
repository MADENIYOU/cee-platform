import type { NextConfig } from "next";
import withSerwist from "@serwist/next";

/**
 * `@serwist/next` ne supporte pas encore Turbopack (devenu le bundler par
 * défaut en Next.js 16) — voir https://github.com/serwist/serwist/issues/54.
 * `pnpm dev`/`pnpm build` forcent donc `--webpack` explicitement (voir
 * package.json) pour garder un service worker PWA réellement fonctionnel.
 * À revisiter quand `@serwist/turbopack` sortira de son statut expérimental.
 */

/**
 * Cache Components (Next.js 16) est volontairement désactivé : la fonctionnalité
 * impose des Suspense boundaries et des directives "use cache: private" sur toute
 * lecture de session, ce qui ajoute une complexité réelle pour un bénéfice marginal
 * ici. Le modèle de rendu dynamique classique est plus simple à maintenir pour une
 * équipe étudiante qui tourne chaque année — voir Plateforme_CEE_Fusion.md §7.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    const r2PublicDomain = process.env.R2_PUBLIC_DOMAIN ?? "";
    const authIssuerOrigin = process.env.AUTH_KEYCLOAK_ISSUER
      ? new URL(process.env.AUTH_KEYCLOAK_ISSUER).origin
      : "";

    const isDev = process.env.NODE_ENV === "development";

    // Recette officielle "Without Nonces" du guide CSP de Next.js (voir
    // node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md) :
    // le mode "nonce via proxy" impose un rendu dynamique sur TOUTES les
    // pages (plus de pages statiques/ISR), incompatible avec notre choix
    // déjà pris d'éviter la complexité "Cache Components" pour rester
    // simple. `'unsafe-inline'` sur script/style est donc assumé ici,
    // conformément à la doc officielle pour les apps qui n'ont pas besoin
    // de nonces — les autres directives restent strictes ('self' partout).
    const csp = [
      "default-src 'self'",
      `img-src 'self' data: blob: ${r2PublicDomain}`.trim(),
      "style-src 'self' 'unsafe-inline'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      `connect-src 'self' ${authIssuerOrigin}`.trim(),
      // Pré-autorisé pour le lecteur vidéo différé du Module 2 (YouTube embed).
      "frame-src 'self' https://www.youtube-nocookie.com",
      "font-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default withSerwist({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // Jamais de cache offline sur les routes d'auth — voir règle d'ingénierie n°11.
  exclude: [/^\/api\/auth\//],
})(nextConfig);
