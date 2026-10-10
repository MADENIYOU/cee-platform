/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import { Serwist } from "serwist";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/**
 * Service worker PWA minimal : cache les assets statiques uniquement.
 *
 * Règle d'ingénierie n°11 (outbox offline) : JAMAIS de cache/outbox sur les
 * routes d'authentification. La stratégie `defaultCache` de Serwist exclut
 * déjà les routes de navigation dynamique par défaut ; on l'exclut aussi
 * explicitement côté next.config.ts (`exclude: [/^\/api\/auth\//]`).
 */
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
