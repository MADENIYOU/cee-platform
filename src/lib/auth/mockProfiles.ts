/**
 * MOCK — remplacé par le Module 1 à l'intégration.
 *
 * Profils factices pour développer le Module 5 sans attendre le moteur
 * d'authentification (voir Module_Administration_Comptes.md §2). Chaque
 * profil respecte exactement le contrat `AppSession`.
 */
import type { AppSession } from "@/types/session";

export const MOCK_PROFILE_COOKIE = "cee_mock_profile";

const BASE = {
  departement: "Génie Informatique",
  classe: "DIC1",
  promo: "2027",
  roles: [],
  isResponsableClasse: false,
} satisfies Partial<AppSession>;

export const MOCK_PROFILES = {
  admin: {
    ...BASE,
    userId: "00000000-0000-4000-8000-000000000001",
    email: "admin.mock@esp.sn",
    nom: "Admin",
    prenom: "Awa",
    roles: ["admin"],
  },
  editeur: {
    ...BASE,
    userId: "00000000-0000-4000-8000-000000000002",
    email: "editeur.mock@esp.sn",
    nom: "Éditeur",
    prenom: "Modou",
    roles: ["editeur"],
  },
  moderateur: {
    ...BASE,
    userId: "00000000-0000-4000-8000-000000000003",
    email: "moderateur.mock@esp.sn",
    nom: "Modérateur",
    prenom: "Fatou",
    roles: ["moderateur"],
  },
  responsable: {
    ...BASE,
    userId: "00000000-0000-4000-8000-000000000004",
    email: "responsable.mock@esp.sn",
    nom: "Responsable",
    prenom: "Ibrahima",
    isResponsableClasse: true,
  },
  etudiant: {
    ...BASE,
    userId: "00000000-0000-4000-8000-000000000005",
    email: "etudiant.mock@esp.sn",
    nom: "Étudiant",
    prenom: "Aïssatou",
  },
} as const satisfies Record<string, AppSession>;

export type MockProfileName = keyof typeof MOCK_PROFILES | "visiteur";

export function isMockProfileName(value: string | undefined): value is MockProfileName {
  return value === "visiteur" || (value !== undefined && value in MOCK_PROFILES);
}

/** `null` = visiteur non connecté, comme dans le contrat réel. */
export function resolveMockProfile(name: MockProfileName): AppSession | null {
  if (name === "visiteur") return null;
  const profile = MOCK_PROFILES[name];
  return { ...profile, roles: [...profile.roles] };
}
