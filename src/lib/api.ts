/**
 * Envoltorio de cada ruta de la API: comprueba la sesión contra la base
 * (un usuario dado de baja deja de entrar en el acto, aunque su cookie
 * siga vigente), el rol si la ruta lo pide, y traduce los errores a
 * respuestas que la pantalla sabe mostrar: `{ error, campo? }`.
 */
import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { COOKIE_DE_SESION, leerSesion, type Sesion } from "@/lib/sesion";
import { ErrorDeDatos } from "@/lib/validacion";

export class NoEncontrado extends Error {}

type Contexto = { params?: Record<string, string> };
type Manejador = (request: NextRequest, sesion: Sesion, ctx: Contexto) => Promise<NextResponse>;

export function error(status: number, mensaje: string, campo?: string): NextResponse {
  return NextResponse.json(campo ? { error: mensaje, campo } : { error: mensaje }, { status });
}

export async function sesionVigente(request: NextRequest): Promise<Sesion | null> {
  const s = await leerSesion(request.cookies.get(COOKIE_DE_SESION)?.value);
  if (!s) return null;
  const u = await prisma.usuario.findUnique({ where: { id: s.id }, select: { id: true, nombre: true, rol: true, activo: true } });
  return u && u.activo ? { id: u.id, nombre: u.nombre, rol: u.rol } : null;
}

export function ruta(manejador: Manejador, opciones: { soloAdmin?: boolean } = {}) {
  return async (request: NextRequest, ctx: Contexto): Promise<NextResponse> => {
    try {
      const sesion = await sesionVigente(request);
      if (!sesion) return error(401, "Tu sesión se cerró. Vuelve a entrar.");
      if (opciones.soloAdmin && sesion.rol !== "ADMIN") return error(403, "Sólo un administrador puede hacer esto.");
      return await manejador(request, sesion, ctx);
    } catch (e) {
      if (e instanceof ErrorDeDatos) return error(400, e.message, e.campo);
      if (e instanceof NoEncontrado) return error(404, e.message || "No existe.");
      if (e instanceof SyntaxError) return error(400, "La solicitud no es un JSON válido.");
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return error(409, "Ya existe uno con ese nombre.");
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") return error(404, "No existe.");
      console.error(`[api] ${request.method} ${request.nextUrl.pathname}`, e);
      return error(500, "Algo falló en el servidor. Vuelve a intentarlo en un momento.");
    }
  };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** El id de la ruta; uno mal formado es algo que no existe. */
export function idDe(ctx: Contexto, que: string): string {
  const id = ctx.params?.id ?? "";
  if (!UUID.test(id)) throw new NoEncontrado(`No existe ${que}.`);
  return id;
}
