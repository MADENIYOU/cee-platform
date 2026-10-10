import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    alias: {
      // "server-only" n'a de sens que dans le bundler de Next.js (garde
      // contre un import côté client) — pas de concept équivalent dans
      // Vitest, donc on le neutralise pour les tests.
      "server-only": new URL("./tests/unit/__mocks__/server-only.ts", import.meta.url).pathname,
      // next-auth importe "next/server" sans extension. Next.js n'a pas de
      // champ "exports" dans son package.json, donc la résolution ESM
      // stricte de Node (utilisée par Vitest, à la différence du bundler
      // de Next.js lui-même) échoue sur ce specifier nu — révélé dès le
      // premier test qui importe la vraie chaîne de session sans la mocker
      // (voir tests/unit/admin/*.integration.test.ts, Module 5).
      "next/server": "next/server.js",
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/unit/setup.ts"],
    include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.test.tsx"],
    exclude: ["tests/e2e/**"],
    server: {
      // Par défaut, Vitest externalise les dépendances de node_modules
      // vers le chargeur ESM natif de Node, qui ignore resolve.alias
      // ci-dessus. next-auth doit passer par le résolveur de Vite pour
      // que l'alias "next/server" -> "next/server.js" s'applique.
      deps: { inline: ["next-auth", "@auth/core"] },
    },
  },
});
