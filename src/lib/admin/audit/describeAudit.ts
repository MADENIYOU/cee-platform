/**
 * Traduit une ligne d'audit en phrases simples pour une personne qui n'est
 * pas informaticienne : ce qui s'est passé, sur quoi, et le détail utile.
 *
 * Pur : ne lit que ce qui a été écrit dans la ligne au moment de l'action
 * (jamais `core.users`), donc reste exact après la purge d'un compte.
 * Un autre module ajoute ses propres actions en complétant `DESCRIBERS`.
 */
import { ROLE_LABELS } from "@/lib/admin/roles/roleRules";
import type { AppRole } from "@/types/session";

export type AuditDescription = { quoi: string; objet: string; details: string };

type Metadata = Record<string, unknown>;
type Describer = { quoi: string; objet: (meta: Metadata) => string; details: (meta: Metadata) => string };

const text = (meta: Metadata, key: string): string | undefined => {
  const value = meta[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

const count = (meta: Metadata, key: string): number => {
  const value = meta[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
};

const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

function roleName(value: unknown): string {
  return typeof value === "string" && value in ROLE_LABELS ? ROLE_LABELS[value as AppRole] : "inconnu";
}

function roleList(value: unknown): string {
  const roles = Array.isArray(value) ? value.map(roleName) : [];
  return roles.length > 0 ? roles.join(", ") : "aucun";
}

const account = (meta: Metadata) => text(meta, "cible") ?? "Un compte";
const classOf = (meta: Metadata) => {
  const classe = text(meta, "classe");
  return classe ? `la classe ${classe}` : "sa classe";
};

function fileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;
  return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
}

const DESCRIBERS: Record<string, Describer> = {
  "import.valide": {
    quoi: "Import de la liste blanche",
    objet: (meta) => {
      const source = text(meta, "source")?.replace(/^departement:/, "");
      return source ? `Liste de ${source}` : "Liste d'étudiants";
    },
    details: (meta) => {
      const summary =
        `${plural(count(meta, "created"), "compte créé", "comptes créés")}, ` +
        `${plural(count(meta, "updated"), "mis à jour", "mis à jour")}, ` +
        `${plural(count(meta, "rejected"), "ligne écartée", "lignes écartées")}.`;
      return text(meta, "status") === "failed" ? `Aucun compte importé. ${summary}` : summary;
    },
  },
  "etudiant.ajoute": {
    quoi: "Ajout d'un étudiant",
    objet: (meta) => text(meta, "cible") ?? "Un étudiant",
    details: (meta) => {
      const departement = text(meta, "departement");
      return `Ajouté à ${classOf(meta)}${departement ? ` (${departement})` : ""} par son responsable de classe.`;
    },
  },
  "role.attribue": {
    quoi: "Attribution d'un rôle",
    objet: account,
    details: (meta) => `A reçu le rôle ${roleName(meta.role)}. Rôles actuels : ${roleList(meta.apres)}.`,
  },
  "role.retire": {
    quoi: "Retrait d'un rôle",
    objet: account,
    details: (meta) => `A perdu le rôle ${roleName(meta.role)}. Rôles restants : ${roleList(meta.apres)}.`,
  },
  "permission.responsable_classe.attribuee": {
    quoi: "Nomination d'un responsable de classe",
    objet: account,
    details: (meta) => `Devient responsable de ${classOf(meta)} : peut y ajouter un étudiant manquant.`,
  },
  "permission.responsable_classe.retiree": {
    quoi: "Fin d'une responsabilité de classe",
    objet: account,
    details: (meta) => `N'est plus responsable de ${classOf(meta)}.`,
  },
  "auth.connexion": {
    quoi: "Connexion",
    objet: () => "Son propre compte",
    details: () => "S'est connecté à la plateforme.",
  },
  "fichier.televerse": {
    quoi: "Envoi d'un fichier",
    objet: () => "Fichier",
    details: (meta) => (count(meta, "sizeBytes") > 0 ? `Fichier de ${fileSize(count(meta, "sizeBytes"))} envoyé.` : "Fichier envoyé."),
  },
};

const ENTITY_LABELS: Record<string, string> = {
  user: "Compte",
  whitelist_import: "Import de liste",
  upload: "Fichier",
  annonce: "Annonce",
  evenement: "Événement",
  post: "Publication",
  signalement: "Signalement",
};

/** Actions et objets proposés dans les filtres du journal, libellés en clair. */
export const AUDIT_ACTION_OPTIONS = Object.entries(DESCRIBERS)
  .map(([value, describer]) => ({ value, label: describer.quoi }))
  .sort((a, b) => a.label.localeCompare(b.label, "fr"));

export const AUDIT_ENTITY_OPTIONS = Object.entries(ENTITY_LABELS)
  .map(([value, label]) => ({ value, label }))
  .sort((a, b) => a.label.localeCompare(b.label, "fr"));

function asMetadata(metadata: unknown): Metadata {
  return metadata && typeof metadata === "object" && !Array.isArray(metadata) ? (metadata as Metadata) : {};
}

/**
 * Une action encore inconnue de ce module (écrite par un autre module) reste
 * affichée, avec son nom d'origine, plutôt que d'être masquée ou devinée.
 */
export function describeAudit(row: { action: string; entity: string; metadata: unknown }): AuditDescription {
  const describer = DESCRIBERS[row.action];
  if (!describer) {
    return { quoi: row.action, objet: ENTITY_LABELS[row.entity] ?? row.entity, details: "—" };
  }
  const meta = asMetadata(row.metadata);
  return { quoi: describer.quoi, objet: describer.objet(meta), details: describer.details(meta) };
}
