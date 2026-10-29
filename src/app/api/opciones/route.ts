/**
 *   POST /api/opciones  → sumar una app o alguien del equipo a su lista.
 *   Cualquiera que carga puede: no tiene que pedírselo a nadie para
 *   anotar a un compañero nuevo.
 */
import { NextResponse } from "next/server";
import { ruta } from "@/lib/api";
import { agregarOpcion } from "@/lib/contactos";
import { opcionNueva } from "@/lib/validacion";

export const dynamic = "force-dynamic";

export const POST = ruta(async (request) => {
  const { tipo, nombre } = opcionNueva(await request.json());
  return NextResponse.json({ ok: true, data: await agregarOpcion(tipo, nombre) });
});
