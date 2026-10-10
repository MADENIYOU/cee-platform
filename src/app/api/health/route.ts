import { prisma } from "@/lib/prisma";

/**
 * Endpoint de santé pour le monitoring et les health checks CI/CD.
 * Pas de session requise — reste accessible même si l'auth est en panne,
 * pour pouvoir diagnostiquer séparément les deux problèmes.
 */
export async function GET(): Promise<Response> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", database: "ok" });
  } catch (error) {
    console.error("[health] base de données injoignable", error);
    return Response.json({ status: "degraded", database: "ko" }, { status: 503 });
  }
}
