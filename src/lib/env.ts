import { z } from "zod";

/**
 * Validation stricte des variables d'environnement au démarrage — échoue
 * vite et clairement plutôt que de laisser une variable manquante
 * provoquer un bug obscur en profondeur de l'application (ex. upload qui
 * échoue silencieusement faute de clé R2).
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL est requis"),
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET est requis (npx auth secret)"),
  AUTH_KEYCLOAK_ISSUER: z.string().url("AUTH_KEYCLOAK_ISSUER doit être une URL valide"),
  AUTH_KEYCLOAK_ID: z.string().min(1, "AUTH_KEYCLOAK_ID est requis"),
  AUTH_KEYCLOAK_SECRET: z.string().min(1, "AUTH_KEYCLOAK_SECRET est requis"),
  AUTH_URL: z.string().url().optional(),
  R2_BUCKET: z.string().min(1, "R2_BUCKET est requis"),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_PUBLIC_DOMAIN: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | undefined;

/**
 * À appeler explicitement au démarrage serveur (ex. premier import de
 * `lib/prisma` ou `lib/auth/auth.config`). Ne jette qu'une seule fois,
 * avec un message clair listant chaque variable manquante.
 */
export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Variables d'environnement invalides :\n${issues}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}
