/**
 *   GET  /api/contactos  → todos los contactos y las listas
 *   POST /api/contactos  → cargar uno
 */
import { NextResponse } from "next/server";
import { ruta } from "@/lib/api";
import { crearContacto, listarContactos, opciones } from "@/lib/contactos";
import { datosDeContacto } from "@/lib/validacion";

export const dynamic = "force-dynamic";

export const GET = ruta(async () => {
  const [contactos, listas] = await Promise.all([listarContactos(), opciones()]);
  return NextResponse.json({ ok: true, data: { contactos, opciones: listas } });
});

export const POST = ruta(async (request, sesion) => {
  const datos = datosDeContacto(await request.json(), (await opciones()).APP);
  const contacto = await crearContacto(datos, sesion.id);
  return NextResponse.json({ ok: true, data: contacto }, { status: 201 });
});
