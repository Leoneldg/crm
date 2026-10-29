/** Contactos y listas en la base. */
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { CRM_TIPOS_DE_OPCION, type CrmContacto, type CrmDatos, type CrmTipoDeOpcion } from "@/lib/crm";

export type CrmOpciones = Record<CrmTipoDeOpcion, string[]>;

const CON_QUIEN = { cargadoPor: { select: { nombre: true } } } satisfies Prisma.ContactoInclude;
type Fila = Prisma.ContactoGetPayload<{ include: typeof CON_QUIEN }>;

/** "2026-10-29" ↔ columna DATE, a medianoche UTC para que la zona
 *  horaria del servidor no la corra un día. */
const aFecha = (s: string | null): Date | null => (s ? new Date(`${s}T00:00:00.000Z`) : null);
const deFecha = (d: Date | null): string | null => (d ? d.toISOString().slice(0, 10) : null);
const deMonto = (v: Prisma.Decimal | null): number | null => (v === null ? null : Number(v));

function aContacto(f: Fila): CrmContacto {
  return {
    id: f.id,
    app: f.app,
    fechaContacto: deFecha(f.fechaContacto),
    contactoTipo: f.contactoTipo,
    canalDigital: f.canalDigital,
    canalFisico: f.canalFisico,
    nombre: f.nombre,
    ciTipo: f.ciTipo,
    ci: f.ci,
    telefono: f.telefono,
    telefono2: f.telefono2,
    correo: f.correo,
    estado: f.estado,
    municipio: f.municipio,
    parroquia: f.parroquia,
    sector: f.sector,
    comunidad: f.comunidad,
    calle: f.calle,
    puntoReferencia: f.puntoReferencia,
    interesado: f.interesado,
    potencial: f.potencial,
    plan: f.plan,
    promotor: f.promotor,
    vendedor: f.vendedor,
    pedido: f.pedido,
    fechaPedido: deFecha(f.fechaPedido),
    monto: deMonto(f.monto),
    credito: f.credito,
    cobranza: f.cobranza,
    cuentasPendientes: deMonto(f.cuentasPendientes),
    cuotas: deMonto(f.cuotas),
    olvidoClave: f.olvidoClave,
    reclamoTipo: f.reclamoTipo,
    reclamo: f.reclamo,
    observaciones: f.observaciones,
    cargadoPor: f.cargadoPor?.nombre ?? null,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
  };
}

const aColumnas = (d: CrmDatos) => ({ ...d, fechaContacto: aFecha(d.fechaContacto), fechaPedido: aFecha(d.fechaPedido) });

export async function listarContactos(): Promise<CrmContacto[]> {
  const filas = await prisma.contacto.findMany({ include: CON_QUIEN, orderBy: { createdAt: "desc" } });
  return filas.map(aContacto);
}

export async function existeContacto(id: string): Promise<boolean> {
  return (await prisma.contacto.count({ where: { id } })) > 0;
}

export async function crearContacto(datos: CrmDatos, usuarioId: string): Promise<CrmContacto> {
  const f = await prisma.contacto.create({ data: { ...aColumnas(datos), cargadoPorId: usuarioId, actualizadoPor: usuarioId }, include: CON_QUIEN });
  return aContacto(f);
}

export async function actualizarContacto(id: string, datos: CrmDatos, usuarioId: string): Promise<CrmContacto> {
  const f = await prisma.contacto.update({ where: { id }, data: { ...aColumnas(datos), actualizadoPor: usuarioId }, include: CON_QUIEN });
  return aContacto(f);
}

export async function borrarContacto(id: string): Promise<void> {
  await prisma.contacto.delete({ where: { id } });
}

export async function opciones(): Promise<CrmOpciones> {
  const filas = await prisma.opcion.findMany({ select: { tipo: true, nombre: true } });
  const salida: CrmOpciones = { APP: [], PROMOTOR: [], VENDEDOR: [] };
  for (const f of filas) {
    if ((CRM_TIPOS_DE_OPCION as readonly string[]).includes(f.tipo)) salida[f.tipo as CrmTipoDeOpcion].push(f.nombre);
  }
  for (const t of CRM_TIPOS_DE_OPCION) salida[t].sort((a, b) => a.localeCompare(b, "es"));
  return salida;
}

/** No duplica: "merk2" no es otra app, se queda la que ya estaba. */
export async function agregarOpcion(tipo: CrmTipoDeOpcion, nombre: string): Promise<CrmOpciones> {
  const actuales = await opciones();
  if (!actuales[tipo].some((n) => n.toLocaleLowerCase("es") === nombre.toLocaleLowerCase("es"))) {
    await prisma.opcion.upsert({ where: { tipo_nombre: { tipo, nombre } }, create: { tipo, nombre }, update: {} });
  }
  return opciones();
}
