/**
 * La sesión es un JWT firmado en una cookie httpOnly. Este archivo no
 * toca la base, para poder usarse también en el middleware (que corre
 * en el runtime Edge). Que el usuario siga activo se comprueba en cada
 * llamada a la API, en auth.ts.
 */
import { SignJWT, jwtVerify } from "jose";

export const COOKIE_DE_SESION = "crm_sesion";
/** Treinta días: el equipo carga desde el teléfono, en la calle, y no
 *  debería tener que entrar de nuevo cada mañana. */
export const DURACION_DE_SESION_S = 30 * 24 * 60 * 60;

export interface Sesion {
  readonly id: string;
  readonly nombre: string;
  readonly rol: "ADMIN" | "EQUIPO";
}

function clave(): Uint8Array {
  const secreto = process.env.SESSION_SECRET;
  if (!secreto || secreto.length < 32) throw new Error("Falta SESSION_SECRET en el .env (al menos 32 caracteres).");
  return new TextEncoder().encode(secreto);
}

export async function firmarSesion(s: Sesion): Promise<string> {
  return new SignJWT({ nombre: s.nombre, rol: s.rol })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(s.id)
    .setIssuedAt()
    .setExpirationTime(`${DURACION_DE_SESION_S}s`)
    .sign(clave());
}

/** null si falta, está vencida o no es nuestra. */
export async function leerSesion(token: string | undefined): Promise<Sesion | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, clave(), { algorithms: ["HS256"] });
    const rol = payload.rol === "ADMIN" ? "ADMIN" : "EQUIPO";
    if (!payload.sub || typeof payload.nombre !== "string") return null;
    return { id: payload.sub, nombre: payload.nombre, rol };
  } catch {
    return null;
  }
}
