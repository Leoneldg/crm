/**
 *   GET  /api/usuarios  → la lista (sólo administradores)
 *   POST /api/usuarios  → crear uno (sólo administradores)
 */
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { ruta } from "@/lib/api";
import { usuarioNuevo } from "@/lib/validacion";
import { DATOS_PUBLICOS_DE_USUARIO } from "@/lib/usuarios";

export const dynamic = "force-dynamic";

export const GET = ruta(
  async () => {
    const usuarios = await prisma.usuario.findMany({ select: DATOS_PUBLICOS_DE_USUARIO, orderBy: [{ activo: "desc" }, { nombre: "asc" }] });
    return NextResponse.json({ ok: true, data: usuarios });
  },
  { soloAdmin: true }
);

export const POST = ruta(
  async (request) => {
    const { nombre, usuario, clave, rol } = usuarioNuevo(await request.json());
    const creado = await prisma.usuario.create({
      data: { nombre, usuario, rol, passwordHash: await bcrypt.hash(clave, 10) },
      select: DATOS_PUBLICOS_DE_USUARIO,
    });
    return NextResponse.json({ ok: true, data: creado }, { status: 201 });
  },
  { soloAdmin: true }
);
