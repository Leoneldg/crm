/**
 *   PATCH /api/usuarios/:id  → cambiar nombre, rol o contraseña, o
 *   darlo de baja / de alta (sólo administradores).
 */
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { idDe, ruta } from "@/lib/api";
import { ErrorDeDatos, cambiosDeUsuario } from "@/lib/validacion";
import { DATOS_PUBLICOS_DE_USUARIO } from "@/lib/usuarios";

export const dynamic = "force-dynamic";

export const PATCH = ruta(
  async (request, sesion, ctx) => {
    const id = idDe(ctx, "ese usuario");
    const { nombre, clave, rol, activo } = cambiosDeUsuario(await request.json());
    // Que nadie se quite a sí mismo la llave: el CRM podría quedar sin
    // ningún administrador.
    if (id === sesion.id && (activo === false || rol === "EQUIPO")) {
      throw new ErrorDeDatos("No puedes darte de baja ni quitarte el rol de administrador a ti mismo.");
    }
    const actualizado = await prisma.usuario.update({
      where: { id },
      // Sólo lo que vino: un campo ausente no se toca.
      data: {
        nombre,
        rol,
        activo,
        passwordHash: clave === undefined ? undefined : await bcrypt.hash(clave, 10),
      },
      select: DATOS_PUBLICOS_DE_USUARIO,
    });
    return NextResponse.json({ ok: true, data: actualizado });
  },
  { soloAdmin: true }
);
