/**
 * Appels du navigateur vers les routes du Module 5.
 *
 * Règles n°2 et n°9 : chaque appel est encadré, et l'appelant reçoit soit
 * la donnée, soit un message déjà lisible — jamais une exception brute.
 * Aucun rejeu automatique ici (règle n°11) : en cas d'échec, c'est la
 * personne qui décide de relancer.
 */
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

const NETWORK_ERROR = "Connexion impossible. Vérifiez votre réseau puis réessayez.";
const UNKNOWN_ERROR = "Une erreur est survenue. Réessayez.";

export async function sendJson<T>(
  url: string,
  method: "POST" | "PATCH",
  body: unknown
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const message = (payload as { error?: unknown } | null)?.error;
      return { ok: false, error: typeof message === "string" ? message : UNKNOWN_ERROR };
    }
    return { ok: true, data: payload as T };
  } catch {
    return { ok: false, error: NETWORK_ERROR };
  }
}
