import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";
import { prisma } from "@/lib/prisma";
import { isAllowedEmailDomain } from "@/lib/auth/domains";
import { logAudit } from "@/lib/audit/logAudit";
import { checkRateLimit } from "@/lib/rate-limit";
import { getEnv } from "@/lib/env";
import type { AppRole } from "@/types/session";

// Échoue vite et clairement si une variable d'environnement requise
// manque, plutôt que de laisser un comportement cassé apparaître plus
// tard en profondeur de l'app (ex. upload qui échoue silencieusement).
const env = getEnv();

/**
 * Auth.js (NextAuth v5), provider OIDC générique via Keycloak.
 *
 * - En dev local : `AUTH_KEYCLOAK_ISSUER` pointe sur le Keycloak du
 *   docker-compose (realm "cee-dev", voir keycloak/realm-export.json).
 * - En prod : pointera sur le moteur d'auth partagé de l'écosystème CEE.
 *   Bascule = changement de variables d'environnement, aucun code à toucher.
 *
 * Stratégie de session : JWT chiffré dans un cookie `httpOnly`
 * (comportement par défaut d'Auth.js) — jamais de token en localStorage
 * (règle d'ingénierie n°16).
 */
// Auth.js active des cookies `Secure` dès que NODE_ENV="production" — ce
// qui est le cas avec `next start`, MÊME en dev local sur http://. Un
// cookie `Secure` est silencieusement rejeté par le navigateur sur une
// origine non HTTPS, ce qui cassait le flux de connexion (CSRF "manquant"
// alors qu'il était juste refusé par le navigateur). On dérive donc le
// réglage de l'URL réelle plutôt que du seul NODE_ENV.
const useSecureCookies = env.AUTH_URL?.startsWith("https://") ?? false;

export const { handlers, auth, signIn, signOut } = NextAuth({
  useSecureCookies,
  providers: [
    Keycloak({
      clientId: env.AUTH_KEYCLOAK_ID,
      clientSecret: env.AUTH_KEYCLOAK_SECRET,
      issuer: env.AUTH_KEYCLOAK_ISSUER,
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/connexion",
    error: "/connexion",
  },
  callbacks: {
    /**
     * Point d'entrée du filtrage de domaine : on rejette ICI, avant toute
     * création de session — pas en vérification a posteriori.
     *
     * Rate limiting (règle n°16, sécurité active) : les tentatives de
     * connexion sont elles aussi soumises au seau à jetons — une route
     * d'authentification est une cible classique de brute-force, elle ne
     * doit pas être le seul endpoint non protégé du module.
     */
    async signIn({ user }) {
      const { success } = await checkRateLimit(`auth:signin:${user.email ?? "unknown"}`);
      if (!success) {
        console.warn("[auth] connexion refusée — quota de tentatives dépassé", {
          email: user.email,
        });
        return false;
      }

      if (!isAllowedEmailDomain(user.email)) {
        console.warn("[auth] connexion refusée — domaine non autorisé", {
          email: user.email,
        });
        return false;
      }
      return true;
    },

    /**
     * Provisioning JIT (just-in-time) : à la connexion, on synchronise le
     * profil local (`core.users`). Keycloak ne connaît que l'identité
     * (nom/prénom/email) — tout le reste (rôles, département, classe)
     * vit exclusivement dans notre base.
     */
    async jwt({ token, profile, account }) {
      if (account && profile?.sub) {
        const email = (profile.email as string | undefined) ?? "";
        const nom = (profile.family_name as string | undefined) ?? "";
        const prenom = (profile.given_name as string | undefined) ?? "";

        try {
          const dbUser = await prisma.user.upsert({
            where: { id: profile.sub },
            update: { email, nom, prenom },
            create: { id: profile.sub, email, nom, prenom, roles: [] },
          });

          token.userId = dbUser.id;
          token.email = dbUser.email;
          token.nom = dbUser.nom;
          token.prenom = dbUser.prenom;
          token.departement = dbUser.departement;
          token.classe = dbUser.classe;
          token.promo = dbUser.promo;
          token.roles = dbUser.roles as AppRole[];
          token.isResponsableClasse = dbUser.isResponsableClasse;

          await logAudit({
            actorId: dbUser.id,
            actorNomSnapshot: `${dbUser.prenom} ${dbUser.nom}`.trim(),
            action: "auth.connexion",
            entity: "user",
            entityId: dbUser.id,
          });
        } catch (error) {
          // Erreur mappée (règle n°9) : on ne laisse jamais une exception
          // Prisma brute remonter dans le flux Auth.js — ça provoquerait
          // un échec de connexion incompréhensible côté utilisateur.
          console.error("[auth] échec du provisioning JIT du profil local", {
            sub: profile.sub,
            error,
          });
          throw new Error("Impossible de synchroniser votre profil. Réessayez.");
        } finally {
          // Point d'extension futur : métriques de connexion (succès/échec).
        }
      }
      return token;
    },

    async session({ session, token }) {
      session.user = {
        ...session.user,
        userId: token.userId as string,
        email: token.email as string,
        nom: token.nom as string,
        prenom: token.prenom as string,
        departement: (token.departement as string | null) ?? null,
        classe: (token.classe as string | null) ?? null,
        promo: (token.promo as string | null) ?? null,
        roles: (token.roles as AppRole[]) ?? [],
        isResponsableClasse: (token.isResponsableClasse as boolean) ?? false,
      };
      return session;
    },
  },
});
