import type { Prisma } from "@prisma/client";

/** Lo que se muestra de un usuario: nunca el hash de la contraseña. */
export const DATOS_PUBLICOS_DE_USUARIO = {
  id: true,
  nombre: true,
  usuario: true,
  rol: true,
  activo: true,
  createdAt: true,
  _count: { select: { contactos: true } },
} satisfies Prisma.UsuarioSelect;

/** Como llega a la pantalla (las fechas, en texto). */
export interface UsuarioPublico {
  id: string;
  nombre: string;
  usuario: string;
  rol: "ADMIN" | "EQUIPO";
  activo: boolean;
  createdAt: string;
  _count: { contactos: number };
}
