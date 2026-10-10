/**
 * Tableau de bord d'accueil : n'expose que les fonctions pertinentes pour
 * les rôles de la personne connectée (Module_Administration_Comptes.md §3.5).
 * Les entrées des autres modules sont de simples liens : ce module ne
 * reconstruit pas leurs écrans.
 */
import type { AppRole, AppSession } from "@/types/session";

export type DashboardItem = {
  id: string;
  label: string;
  description: string;
  href: string;
  /** `true` tant que l'écran est livré par un autre module. */
  external: boolean;
};

type Rule = DashboardItem & { visibleTo: (session: AppSession) => boolean };

const hasRole = (role: AppRole) => (session: AppSession) => session.roles.includes(role);

const RULES: readonly Rule[] = [
  {
    id: "import",
    label: "Importer la liste blanche",
    description: "Importer le fichier Excel d'une structure départementale.",
    href: "/admin/comptes/import",
    external: false,
    visibleTo: hasRole("admin"),
  },
  {
    id: "comptes",
    label: "Comptes",
    description: "Consulter les comptes inscrits sur la liste blanche.",
    href: "/admin/comptes",
    external: false,
    visibleTo: hasRole("admin"),
  },
  {
    id: "roles",
    label: "Gestion des rôles",
    description: "Attribuer ou retirer les droits Éditeur, Modérateur et Admin.",
    href: "/admin/roles",
    external: false,
    visibleTo: hasRole("admin"),
  },
  {
    id: "audit",
    label: "Journal d'audit",
    description: "Qui a fait quoi, et quand, sur toute la plateforme.",
    href: "/admin/audit",
    external: false,
    visibleTo: hasRole("admin"),
  },
  {
    id: "annonces",
    label: "Gérer les annonces",
    description: "Annonces, événements, contenu vitrine et vidéos de présentation.",
    href: "/admin/annonces",
    external: true,
    visibleTo: hasRole("editeur"),
  },
  {
    id: "signalements",
    label: "File de signalements",
    description: "Traiter les signalements du réseau social.",
    href: "/admin/signalements",
    external: true,
    visibleTo: hasRole("moderateur"),
  },
  {
    id: "ajout-etudiant",
    label: "Ajouter un étudiant à ma classe",
    description: "Inscrire un camarade absent de la liste de votre classe.",
    href: "/classe/ajouter-etudiant",
    external: false,
    visibleTo: (session) => session.isResponsableClasse && !!session.classe,
  },
];

export function getDashboardItems(session: AppSession): DashboardItem[] {
  return RULES.filter((rule) => rule.visibleTo(session)).map(
    ({ id, label, description, href, external }) => ({ id, label, description, href, external })
  );
}
