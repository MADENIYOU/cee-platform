import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js 16 : "Middleware" a été renommé "Proxy" (même fonctionnalité,
 * voir node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md).
 *
 * Rôle ici : défense CSRF légère. Les routes Auth.js (/api/auth/*) gèrent
 * déjà leur propre protection CSRF — on ne vérifie que nos routes de
 * mutation maison.
 *
 * Note Next.js : le Proxy sert aux vérifications "optimistes" (headers,
 * redirections), PAS à l'autorisation faisant foi — celle-ci reste portée
 * par requireRole()/getSession() dans chaque route (défense en profondeur).
 */
const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  const isApiRoute = pathname.startsWith("/api/");
  const isAuthRoute = pathname.startsWith("/api/auth/");

  if (isApiRoute && !isAuthRoute && MUTATION_METHODS.has(request.method)) {
    const origin = request.headers.get("origin");
    const expectedOrigin = request.nextUrl.origin;

    if (!origin || origin !== expectedOrigin) {
      return NextResponse.json(
        { error: "Origine de la requête non autorisée (CSRF)" },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
