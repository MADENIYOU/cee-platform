"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * Vaut `false` dans le HTML rendu par le serveur, `true` une fois la page
 * interactive. Sert à désactiver un champ tant qu'aucun code n'écoute :
 * un fichier choisi trop tôt serait ignoré sans aucun message.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
