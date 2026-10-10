import type { AppRole } from "@/types/session";

type NavItem = { label: string; href: string };

/**
 * Menu bifurqué par rôle — un seul layout, contenu de menu variable
 * (voir Module_Fondations_Identite.md §2). Server Component : pas besoin
 * d'interactivité client ici, juste un rendu conditionnel.
 */
export function RoleNav({ roles }: { roles: AppRole[] }) {
  const items: NavItem[] = [
    { label: "Accueil", href: "/" },
    ...(roles.includes("admin") || roles.includes("editeur") || roles.includes("moderateur")
      ? [{ label: "Tableau de bord", href: "/admin" }]
      : []),
  ];

  return (
    <nav aria-label="Navigation principale">
      <ul className="flex items-center gap-4 text-sm">
        {items.map((item) => (
          <li key={item.href}>
            <a href={item.href} className="hover:underline">
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
