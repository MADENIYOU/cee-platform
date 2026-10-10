import type { DefaultSession } from "next-auth";
import type { AppRole } from "@/types/session";

/**
 * Augmentation des types Auth.js pour porter notre contrat de session
 * (voir src/types/session.ts) à travers `session.user`.
 */
declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      userId: string;
      email: string;
      nom: string;
      prenom: string;
      departement: string | null;
      classe: string | null;
      promo: string | null;
      roles: AppRole[];
      isResponsableClasse: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    nom?: string;
    prenom?: string;
    departement?: string | null;
    classe?: string | null;
    promo?: string | null;
    roles?: AppRole[];
    isResponsableClasse?: boolean;
  }
}
