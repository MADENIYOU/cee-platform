export type Role = "editeur" | "moderateur" | "admin";

export type Session = {
  userId: string;
  nom: string;
  departement: string;
  classe: string;
  roles: Role[];
} | null;

export async function getSession(): Promise<Session> {
  return {
    userId: "00000000-0000-0000-0000-000000000001",
    nom: "Utilisateur Test",
    departement: "Génie Informatique",
    classe: "L3 GLSI",
    roles: ["editeur"],
  };
}

export async function requireRole(role: Role) {
  const s = await getSession();
  if (!s || !s.roles.includes(role)) throw new Error("FORBIDDEN");
  return s;
}

export async function uploadFile(file: File): Promise<{ url: string }> {
  return { url: `/mock-uploads/${encodeURIComponent(file.name)}` };
}

export async function logAudit(action: string, details?: unknown) {
  console.log("[AUDIT]", action, details);
}
