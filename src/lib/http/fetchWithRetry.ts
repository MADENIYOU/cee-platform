/**
 * Client HTTP centralisé avec retry/backoff — règle d'ingénierie n°3.
 *
 * - Backoff : 1s, puis 3s, puis 6s.
 * - JAMAIS de retry sur une erreur 4xx (rejet définitif, pas transitoire —
 *   ex. domaine email refusé par le moteur d'auth).
 * - Retry uniquement sur erreur réseau ou 5xx.
 */
const BACKOFF_DELAYS_MS = [1000, 3000, 6000] as const;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type FetchWithRetryOptions = RequestInit & {
  /** Nombre de tentatives supplémentaires après l'échec initial (défaut: 3). */
  maxRetries?: number;
};

export async function fetchWithRetry(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<Response> {
  const { maxRetries = BACKOFF_DELAYS_MS.length, ...init } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, init);

      // Jamais de retry sur un 4xx : c'est un rejet définitif (ex. 403
      // domaine refusé), pas une panne transitoire.
      if (response.status >= 400 && response.status < 500) {
        return response;
      }

      if (response.ok) {
        return response;
      }

      // 5xx : on retente si des tentatives restent.
      lastError = new Error(`Réponse ${response.status} de ${url}`);
    } catch (error) {
      // Erreur réseau : on retente.
      lastError = error;
    }

    const delay = BACKOFF_DELAYS_MS[attempt];
    if (attempt < maxRetries && delay !== undefined) {
      await sleep(delay);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Échec de la requête vers ${url} après ${maxRetries + 1} tentatives`);
}
