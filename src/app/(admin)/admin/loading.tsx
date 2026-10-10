/** État « chargement » commun aux écrans d'administration (règle n°1). */
export default function AdminLoading() {
  return (
    <p role="status" className="p-4 text-[var(--color-muted-foreground)]">
      Chargement…
    </p>
  );
}
