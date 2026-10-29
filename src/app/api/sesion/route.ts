/**
 *   POST   /api/sesion  → entrar con usuario y contraseña
 *   GET    /api/sesion  → quién soy
 *   DELETE /api/sesion  → salir
 */
import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { error, sesionVigente } from "@/lib/api";
import { COOKIE_DE_SESION, DURACION_DE_SESION_S, firmarSesion } from "@/lib/sesion";
import { ErrorDeDatos, datosDeEntrada } from "@/lib/validacion";

export const dynamic = "force-dynamic";

/** Si el usuario no existe se compara igual contra este hash, para que
 *  la respuesta tarde lo mismo y no delate qué usuarios existen. Se
 *  calcula una vez, al primer intento. */
let hashDeRelleno: Promise<string> | null = null;

/** Intentos fallidos por IP en los últimos 15 minutos. En memoria: el
 *  CRM corre en un solo contenedor. */
const fallidos = new Map<string, number[]>();
const VENTANA_MS = 15 * 60 * 1000;
const MAX_FALLIDOS = 10;

function ipDe(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = ipDe(request);
  const ahora = Date.now();
  const recientes = (fallidos.get(ip) ?? []).filter((t) => ahora - t < VENTANA_MS);
  if (recientes.length >= MAX_FALLIDOS) return error(429, "Demasiados intentos. Espera 15 minutos y vuelve a probar.");

  try {
    const { usuario, clave } = datosDeEntrada(await request.json().catch(() => ({})));
    const u = await prisma.usuario.findUnique({ where: { usuario } });
    hashDeRelleno ??= bcrypt.hash("relleno-que-nunca-coincide", 10);
    const coincide = await bcrypt.compare(clave, u?.passwordHash ?? (await hashDeRelleno));
    if (!u || !coincide || !u.activo) {
      fallidos.set(ip, [...recientes, ahora]);
      return error(401, u && coincide && !u.activo ? "Tu usuario está dado de baja. Habla con un administrador." : "Usuario o contraseña incorrectos.");
    }
    fallidos.delete(ip);
    const token = await firmarSesion({ id: u.id, nombre: u.nombre, rol: u.rol });
    const res = NextResponse.json({ ok: true, data: { id: u.id, nombre: u.nombre, rol: u.rol } });
    res.cookies.set(COOKIE_DE_SESION, token, {
      httpOnly: true,
      sameSite: "lax",
      // Sin HTTPS (probando por IP) la cookie segura no se guarda:
      // COOKIE_INSEGURA=1 lo permite mientras tanto.
      secure: process.env.NODE_ENV === "production" && process.env.COOKIE_INSEGURA !== "1",
      path: "/",
      maxAge: DURACION_DE_SESION_S,
    });
    return res;
  } catch (e) {
    if (e instanceof ErrorDeDatos) return error(400, e.message, e.campo);
    console.error("[sesion] POST", e);
    return error(500, "Algo falló en el servidor. Vuelve a intentarlo en un momento.");
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const s = await sesionVigente(request);
  return s ? NextResponse.json({ ok: true, data: s }) : error(401, "No hay sesión.");
}

export async function DELETE(): Promise<NextResponse> {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_DE_SESION, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
