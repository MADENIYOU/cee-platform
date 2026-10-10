import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Rate limiting par algorithme "token bucket" (seau à jetons) : chaque
 * client dispose d'un seau rempli jusqu'à `capacity` jetons, qui se
 * recharge au débit `refillRate`/`interval`. Autorise des rafales
 * ponctuelles tout en bornant le débit moyen dans la durée — à la demande
 * explicite du Lead Dev (pas une fenêtre fixe/glissante).
 *
 * Fallback mémoire si Upstash n'est pas configuré (dev uniquement — ne
 * fonctionne que sur une seule instance, voir avertissement ci-dessous).
 */

const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = hasUpstash
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : undefined;

/** Seau à jetons par défaut : 10 jetons, recharge de 5 jetons / 60s. */
export const uploadRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.tokenBucket(5, "60 s", 10),
      prefix: "ratelimit:upload",
    })
  : null;

type MemoryBucket = { tokens: number; lastRefill: number };
const memoryBuckets = new Map<string, MemoryBucket>();
const MEMORY_CAPACITY = 10;
const MEMORY_REFILL_PER_MS = 5 / 60_000; // 5 jetons / 60s

/**
 * À appeler avant toute opération sensible/coûteuse (ex. upload). Retourne
 * `{ success: false }` si le seau du client est vide.
 */
export async function checkRateLimit(
  identifier: string
): Promise<{ success: boolean; remaining: number }> {
  if (uploadRateLimiter) {
    const { success, remaining } = await uploadRateLimiter.limit(identifier);
    return { success, remaining };
  }

  // Fallback mémoire — dev/mono-instance uniquement. Un vrai déploiement de
  // production sans Upstash configuré doit échouer bruyamment au lieu de
  // dégrader silencieusement la protection (chaque instance aurait son
  // propre seau, donc une limite contournable en multipliant les instances).
  // Détection par schéma d'AUTH_URL (comme pour useSecureCookies dans
  // auth.config.ts) et non par NODE_ENV seul : `next build && next start`
  // tourne aussi en NODE_ENV=production pour les tests E2E locaux/CI, où
  // AUTH_URL reste en http://localhost — donc pas une vraie prod.
  if (process.env.AUTH_URL?.startsWith("https://")) {
    throw new Error(
      "[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN manquants en production — " +
        "le fallback mémoire ne protège pas un déploiement multi-instance."
    );
  }

  console.warn(
    "[rate-limit] UPSTASH non configuré — fallback mémoire (dev uniquement)"
  );
  const now = Date.now();
  const bucket = memoryBuckets.get(identifier) ?? {
    tokens: MEMORY_CAPACITY,
    lastRefill: now,
  };

  const elapsed = now - bucket.lastRefill;
  bucket.tokens = Math.min(MEMORY_CAPACITY, bucket.tokens + elapsed * MEMORY_REFILL_PER_MS);
  bucket.lastRefill = now;

  if (bucket.tokens < 1) {
    memoryBuckets.set(identifier, bucket);
    return { success: false, remaining: 0 };
  }

  bucket.tokens -= 1;
  memoryBuckets.set(identifier, bucket);
  return { success: true, remaining: Math.floor(bucket.tokens) };
}
