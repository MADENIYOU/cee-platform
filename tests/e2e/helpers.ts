import type { BrowserContext } from "@playwright/test";
import { encode } from "@auth/core/jwt";
import { PrismaClient, type Role } from "@prisma/client";

// `playwright test` (contrairement à `next start`, lancé en sous-processus
// par webServer) ne charge pas .env lui-même : ce process a besoin
// d'AUTH_SECRET et DATABASE_URL pour fabriquer de vraies sessions.
process.loadEnvFile?.();

export const BASE_URL = process.env.AUTH_URL ?? "http://localhost:3000";

const prisma = new PrismaClient();

type Profile = "admin" | "editeur" | "moderateur" | "responsable" | "etudiant" | "visiteur";

type FixedProfile = {
  userId: string;
  email: string;
  nom: string;
  prenom: string;
  departement: string;
  classe: string;
  promo: string;
  roles: Role[];
  isResponsableClasse: boolean;
};

const BASE = { departement: "Génie Informatique", classe: "DIC1", promo: "2027" } as const;

/**
 * Profils fixes utilisés par les tests E2E du Module 5 — mêmes identités
 * (id/nom/prénom) que l'ancien `MOCK_PROFILES` (src/lib/auth/mockProfiles.ts),
 * pour ne pas avoir à retoucher les assertions existantes qui cherchent
 * "Awa Admin" ou "Aïssatou Étudiant".
 */
const PROFILES: Record<Exclude<Profile, "visiteur">, FixedProfile> = {
  admin: {
    ...BASE,
    userId: "00000000-0000-4000-8000-000000000001",
    email: "admin.mock@esp.sn",
    nom: "Admin",
    prenom: "Awa",
    roles: ["admin"],
    isResponsableClasse: false,
  },
  editeur: {
    ...BASE,
    userId: "00000000-0000-4000-8000-000000000002",
    email: "editeur.mock@esp.sn",
    nom: "Éditeur",
    prenom: "Modou",
    roles: ["editeur"],
    isResponsableClasse: false,
  },
  moderateur: {
    ...BASE,
    userId: "00000000-0000-4000-8000-000000000003",
    email: "moderateur.mock@esp.sn",
    nom: "Modérateur",
    prenom: "Fatou",
    roles: ["moderateur"],
    isResponsableClasse: false,
  },
  responsable: {
    ...BASE,
    userId: "00000000-0000-4000-8000-000000000004",
    email: "responsable.mock@esp.sn",
    nom: "Responsable",
    prenom: "Ibrahima",
    roles: [],
    isResponsableClasse: true,
  },
  etudiant: {
    ...BASE,
    userId: "00000000-0000-4000-8000-000000000005",
    email: "etudiant.mock@esp.sn",
    nom: "Étudiant",
    prenom: "Aïssatou",
    roles: [],
    isResponsableClasse: false,
  },
};

// Nom par défaut (sans préfixe __Secure-) : AUTH_URL est en http:// dans la
// stack de dev, donc useSecureCookies vaut false côté serveur (voir
// src/lib/auth/auth.config.ts) — le cookie doit porter le même nom.
const SESSION_COOKIE_NAME = "authjs.session-token";

/**
 * Connecte le navigateur de test avec une vraie session Auth.js (même
 * cookie chiffré qu'une vraie connexion Keycloak produirait), pour un des
 * profils fixes ci-dessus.
 *
 * Remplace l'ancien cookie `cee_mock_profile` : celui-ci n'a plus de sens
 * depuis que `src/lib/auth/session.ts` est le vrai module d'authentification
 * du Module 1 et non plus un mock — il ignore ce cookie.
 *
 * Écrit le profil directement dans `core.users` plutôt que de passer par une
 * vraie connexion Keycloak (lente, et Keycloak ne connaît pas les rôles :
 * ils vivent exclusivement dans notre base, voir Authentification-CEE.md).
 * Le cookie de session produit, lui, est un vrai jeton Auth.js, chiffré avec
 * le même secret que le serveur : `getSession()` le décode normalement.
 */
export async function useProfile(context: BrowserContext, profile: Profile): Promise<void> {
  if (profile === "visiteur") {
    await context.clearCookies();
    return;
  }

  const p = PROFILES[profile];

  await prisma.user.upsert({
    where: { id: p.userId },
    update: {
      email: p.email,
      nom: p.nom,
      prenom: p.prenom,
      departement: p.departement,
      classe: p.classe,
      promo: p.promo,
      roles: p.roles,
      isResponsableClasse: p.isResponsableClasse,
    },
    create: {
      id: p.userId,
      email: p.email,
      nom: p.nom,
      prenom: p.prenom,
      departement: p.departement,
      classe: p.classe,
      promo: p.promo,
      roles: p.roles,
      isResponsableClasse: p.isResponsableClasse,
    },
  });

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET manquant dans l'environnement du test E2E (voir .env).");
  }

  const token = await encode({
    secret,
    salt: SESSION_COOKIE_NAME,
    token: {
      sub: p.userId,
      userId: p.userId,
      email: p.email,
      nom: p.nom,
      prenom: p.prenom,
      departement: p.departement,
      classe: p.classe,
      promo: p.promo,
      roles: p.roles,
      isResponsableClasse: p.isResponsableClasse,
    },
  });

  await context.addCookies([
    {
      name: SESSION_COOKIE_NAME,
      value: token,
      url: BASE_URL,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}

/** Les routes de mutation exigent un en-tête Origin (protection CSRF). */
export const SAME_ORIGIN = { origin: BASE_URL };
