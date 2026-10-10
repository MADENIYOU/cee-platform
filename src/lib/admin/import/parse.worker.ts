/**
 * Web Worker : la lecture du fichier Excel (jusqu'à ~7000 lignes) se fait
 * hors du fil d'affichage, pour ne jamais figer l'interface (règle n°5).
 */
import { readSheet } from "read-excel-file/web-worker";

export type WorkerReply = { ok: true; sheet: unknown[][] } | { ok: false };

self.addEventListener("message", async (event: MessageEvent<ArrayBuffer>) => {
  let reply: WorkerReply;
  try {
    reply = { ok: true, sheet: await readSheet(event.data) };
  } catch {
    reply = { ok: false };
  }
  self.postMessage(reply);
});
