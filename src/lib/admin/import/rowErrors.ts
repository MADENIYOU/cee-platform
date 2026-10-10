/**
 * Règle d'ingénierie n°9 (erreurs mappées) : chaque ligne rejetée porte un
 * code stable, traduit ici en raison lisible. Jamais d'erreur de parsing
 * brute à l'écran.
 */
export const ROW_ERROR_MESSAGES = {
  NOM_MANQUANT: "Le nom est vide.",
  PRENOM_MANQUANT: "Le prénom est vide.",
  ADRESSE_INVALIDE: "L'adresse n'a pas un format valide.",
  DOMAINE_REFUSE: "Seules les adresses @esp.sn et @gmail.com sont acceptées.",
  DEPARTEMENT_INCONNU: "Ce département n'existe pas.",
  CLASSE_INCONNUE: "Cette classe n'existe pas.",
  PROMO_INVALIDE: "La promo doit être une année sur 4 chiffres (ex. 2027).",
  DOUBLON_FICHIER: "Cette adresse apparaît déjà plus haut dans le fichier.",
} as const;

export type RowErrorCode = keyof typeof ROW_ERROR_MESSAGES;

export const ROW_ERROR_CODES = Object.keys(ROW_ERROR_MESSAGES) as RowErrorCode[];

export function describeRowError(code: RowErrorCode): string {
  return ROW_ERROR_MESSAGES[code];
}
