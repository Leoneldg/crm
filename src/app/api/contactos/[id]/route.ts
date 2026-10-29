/**
 *   PUT    /api/contactos/:id  → corregirlo (cualquiera del equipo)
 *   DELETE /api/contactos/:id  → borrarlo (sólo administradores)
 */
import { NextResponse } from "next/server";
import { NoEncontrado, idDe, ruta } from "@/lib/api";
import { actualizarContacto, borrarContacto, existeContacto, opciones } from "@/lib/contactos";
import { datosDeContacto } from "@/lib/validacion";

export const dynamic = "force-dynamic";

export const PUT = ruta(async (request, sesion, ctx) => {
  const id = idDe(ctx, "ese contacto");
  if (!(await existeContacto(id))) throw new NoEncontrado("Ese contacto ya no existe. Recarga la lista.");
  const datos = datosDeContacto(await request.json(), (await opciones()).APP);
  return NextResponse.json({ ok: true, data: await actualizarContacto(id, datos, sesion.id) });
});

export const DELETE = ruta(
  async (_request, _sesion, ctx) => {
    await borrarContacto(idDe(ctx, "ese contacto"));
    return NextResponse.json({ ok: true });
  },
  { soloAdmin: true }
);
