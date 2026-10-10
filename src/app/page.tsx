/**
 * MOCK — remplacé par le Module 1 à l'intégration.
 *
 * La vraie page d'accueil appartient aux Modules 1 et 2. En attendant, la
 * racine renvoie vers le tableau de bord, seul point d'entrée de ce module.
 */
import { redirect } from "next/navigation";

export default function HomePage(): never {
  redirect("/admin");
}
