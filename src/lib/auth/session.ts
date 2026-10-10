/**
 * MOCK — remplacé par le Module 1 à l'intégration.
 *
 * Même chemin et mêmes exports que le vrai `session.ts` du Module 1 (voir
 * Module_Fondations_Identite.md §2) : le code du Module 5 importe
 * `@/lib/auth/session` sans savoir s'il parle au mock ou au vrai moteur.
 * À la fusion, ce fichier est remplacé tel quel par celui du Module 1.
 *
 * Le profil vient du cookie de dev `cee_mock_profile` (pratique pour
 * changer de rôle dans les tests E2E), sinon de `CEE_MOCK_SESSION`.
 */
import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { isAllowedEmailDomain } from "@/lib/auth/domains";
import {
  MOCK_PROFILE_COOKIE,
  isMockProfileName,
  resolveMockProfile,
} from "@/lib/auth/mockProfiles";
import type { AppRole, AppSession } from "@/types/session";

function readDefaultProfile() {
  const fromEnv = process.env.CEE_MOCK_SESSION;
  if (!isMockProfileName(fromEnv)) {
    throw new Error(
      "Session mockée non configurée : définir CEE_MOCK_SESSION " +
        "(admin, editeur, moderateur, responsable, etudiant ou visiteur)."
    );
  }
  return fromEnv;
}

/**
 * Simule le provisioning JIT du Module 1 : le profil local existe dans
 * `core.users` dès la « connexion », sans quoi `logAudit()` violerait la
 * clé étrangère `actor_id`. N'écrase jamais des rôles déjà modifiés.
 */
async function ensureLocalProfile(session: AppSession): Promise<void> {
  await prisma.user.upsert({
    where: { id: session.userId },
    update: {},
    create: {
      id: session.userId,
      email: session.email,
      nom: session.nom,
      prenom: session.prenom,
      departement: session.departement,
      classe: session.classe,
      promo: session.promo,
      roles: session.roles,
      isResponsableClasse: session.isResponsableClasse,
    },
  });
}

export const getSession = cache(async (): Promise<AppSession | null> => {
  const defaultProfile = readDefaultProfile();
  const fromCookie = (await cookies()).get(MOCK_PROFILE_COOKIE)?.value;
  const session = resolveMockProfile(isMockProfileName(fromCookie) ? fromCookie : defaultProfile);
  if (!session) return null;

  await ensureLocalProfile(session);
  return session;
});

export class ForbiddenError extends Error {
  constructor(message = "Accès refusé") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message = "Authentification requise") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export async function requireRole(role: AppRole): Promise<AppSession> {
  const session = await getSession();
  if (!session) throw new UnauthorizedError();
  if (!session.roles.includes(role)) {
    throw new ForbiddenError(`Rôle "${role}" requis`);
  }
  return session;
}

export async function requireStudentDomain(): Promise<AppSession> {
  const session = await getSession();
  if (!session) throw new UnauthorizedError();
  if (!isAllowedEmailDomain(session.email)) {
    throw new ForbiddenError("Domaine email non autorisé");
  }
  return session;
}

/** Petit utilitaire pour mapper nos erreurs typées vers une Response HTTP. */
export function toHttpResponse(error: unknown): Response {
  if (error instanceof UnauthorizedError) {
    return Response.json({ error: error.message }, { status: 401 });
  }
  if (error instanceof ForbiddenError) {
    return Response.json({ error: error.message }, { status: 403 });
  }
  console.error("[session] erreur non mappée", error);
  return Response.json({ error: "Erreur interne" }, { status: 500 });
}
