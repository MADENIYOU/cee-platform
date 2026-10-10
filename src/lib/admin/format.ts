const DATE_TIME = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Africa/Dakar",
});

/** Date et heure à l'heure de Dakar, quel que soit le fuseau du serveur. */
export function formatDateTime(date: Date): string {
  return DATE_TIME.format(date);
}
