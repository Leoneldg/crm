/**
 * Sin cookie de sesión, toda pantalla manda a /login.
 *
 * Acá sólo se mira que la cookie exista: la firma, el vencimiento y que
 * el usuario siga activo los comprueba la API en cada llamada (ver
 * lib/api.ts), que es donde están los datos. Una cookie falsa deja ver
 * la pantalla vacía y nada más; la primera llamada responde 401 y la
 * pantalla manda a /login.
 */
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_DE_SESION } from "@/lib/sesion";

export function middleware(request: NextRequest): NextResponse {
  const tieneSesion = Boolean(request.cookies.get(COOKIE_DE_SESION)?.value);
  const enLogin = request.nextUrl.pathname === "/login";
  if (!tieneSesion && !enLogin) return NextResponse.redirect(new URL("/login", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
