/**
 * Lo que entra por la API se valida acá antes de tocar la base.
 *
 * Las opciones fijas (canales, potencial, planes…) se validan contra
 * crm.ts: un valor que no está en la lista no entra, así el Excel sale
 * parejo. La app tiene que existir en la lista de apps; promotor y
 * vendedor no, porque alguien puede irse del equipo y lo que cargó
 * tiene que seguir guardándose igual al corregirlo.
 */
import { z } from "zod";
import {
  CRM_CANALES_DIGITALES,
  CRM_CANALES_FISICOS,
  CRM_CI_TIPOS,
  CRM_COBRANZA,
  CRM_CONTACTO_TIPOS,
  CRM_INTERESADO,
  CRM_PLANES,
  CRM_POTENCIAL,
  CRM_RECLAMOS,
  CRM_SI_NO,
  CRM_TIPOS_DE_OPCION,
  type CrmDatos,
} from "@/lib/crm";

/** Un dato que no pasa: va al usuario tal cual, con el campo. */
export class ErrorDeDatos extends Error {
  constructor(
    message: string,
    readonly campo?: string
  ) {
    super(message);
  }
}

function validar<T extends z.ZodTypeAny>(schema: T, raw: unknown): z.output<T> {
  const r = schema.safeParse(raw ?? {});
  if (!r.success) {
    const issue = r.error.issues[0];
    throw new ErrorDeDatos(issue?.message ?? "Datos inválidos.", issue ? String(issue.path[0] ?? "") : undefined);
  }
  return r.data;
}

const texto = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `No puede pasar de ${max} caracteres.`)
    .nullish()
    .transform((v) => (v ? v.replace(/\s+/g, " ") : null));

const opcion = (lista: readonly string[], campo: string) =>
  z
    .string()
    .nullish()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || lista.includes(v), `Elige una opción válida en ${campo}.`);

const fecha = z
  .string()
  .nullish()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), "La fecha debe verse así: 2026-10-29.");

const monto = z
  .union([z.number(), z.string()])
  .nullish()
  .transform((v) => (v === null || v === undefined || v === "" ? null : Number(v)))
  .refine((v) => v === null || (Number.isFinite(v) && v >= 0 && v < 10_000_000_000), "El monto debe ser un número positivo.")
  .transform((v) => (v === null ? null : Math.round(v * 100) / 100));

const telefono = z
  .string()
  .trim()
  .nullish()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^[+\d][\d\s-]{6,19}$/.test(v), "El teléfono sólo lleva números, espacios, guiones y el +.");

const contactoSchema = z.object({
  app: z.string().trim().min(1, "Elige la app de donde viene el cliente.").max(60),
  fechaContacto: fecha,
  contactoTipo: opcion(CRM_CONTACTO_TIPOS, "1er contacto"),
  canalDigital: opcion(CRM_CANALES_DIGITALES, "canal digital"),
  canalFisico: opcion(CRM_CANALES_FISICOS, "canal físico"),
  nombre: z
    .string()
    .trim()
    .min(2, "Escribe el nombre del cliente.")
    .max(160)
    .transform((v) => v.replace(/\s+/g, " ")),
  ciTipo: opcion(CRM_CI_TIPOS, "tipo de cédula"),
  ci: z
    .string()
    .nullish()
    .transform((v) => (v ? v.replace(/\D/g, "") || null : null))
    .refine((v) => v === null || (v.length >= 5 && v.length <= 10), "La cédula lleva entre 5 y 10 números."),
  telefono,
  telefono2: telefono,
  correo: z
    .string()
    .trim()
    .toLowerCase()
    .nullish()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || (v.length <= 160 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)), "Revisa el correo: debe verse así: nombre@correo.com."),
  estado: texto(80),
  municipio: texto(80),
  parroquia: texto(80),
  sector: texto(120),
  comunidad: texto(120),
  calle: texto(200),
  puntoReferencia: texto(300),
  interesado: opcion(CRM_INTERESADO, "interesado"),
  potencial: opcion(CRM_POTENCIAL, "potencial"),
  plan: opcion(CRM_PLANES, "plan"),
  promotor: texto(120),
  vendedor: texto(120),
  pedido: opcion(CRM_SI_NO, "pedido"),
  fechaPedido: fecha,
  monto,
  credito: opcion(CRM_SI_NO, "crédito"),
  cobranza: opcion(CRM_COBRANZA, "cobranza"),
  cuentasPendientes: monto,
  cuotas: monto,
  olvidoClave: opcion(CRM_SI_NO, "olvido de contraseña"),
  reclamoTipo: opcion(CRM_RECLAMOS, "reclamo"),
  reclamo: texto(500),
  observaciones: z
    .string()
    .trim()
    .max(4000, "Las observaciones no pueden pasar de 4000 caracteres.")
    .nullish()
    .transform((v) => (v ? v : null)),
});

/** Valida y deja el registro coherente: sin teléfono ni cédula no se
 *  puede volver a ubicar al cliente, y el canal tiene que ser del lado
 *  del contacto que se eligió. */
export function datosDeContacto(raw: unknown, apps: readonly string[]): CrmDatos {
  const d = validar(contactoSchema, raw);
  if (!apps.includes(d.app)) throw new ErrorDeDatos(`La app «${d.app}» no está en la lista. Agrégala primero.`, "app");
  if (!d.telefono && !d.ci) throw new ErrorDeDatos("Escribe al menos un teléfono o la cédula, para poder volver a ubicarlo.", "telefono");
  return {
    ...d,
    ciTipo: d.ci ? (d.ciTipo ?? "V") : null,
    canalDigital: d.contactoTipo === "Digital" ? d.canalDigital : null,
    canalFisico: d.contactoTipo === "Físico" ? d.canalFisico : null,
    fechaPedido: d.pedido === "Sí" ? d.fechaPedido : null,
    monto: d.pedido === "Sí" ? d.monto : null,
  };
}

const nombreDeLista = z
  .string()
  .trim()
  .min(2, "El nombre es muy corto.")
  .max(60, "El nombre no puede pasar de 60 caracteres.")
  .transform((v) => v.replace(/\s+/g, " "));

export function opcionNueva(raw: unknown) {
  return validar(z.object({ tipo: z.enum(CRM_TIPOS_DE_OPCION, { errorMap: () => ({ message: "Lista desconocida." }) }), nombre: nombreDeLista }), raw);
}

const usuario = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9._-]{3,40}$/, "El usuario lleva de 3 a 40 letras sin acentos, números, punto, guion o guion bajo.");
const clave = z.string().min(8, "La contraseña lleva al menos 8 caracteres.").max(100);
const nombreDePersona = z
  .string()
  .trim()
  .min(2, "Escribe el nombre.")
  .max(120)
  .transform((v) => v.replace(/\s+/g, " "));

export function datosDeEntrada(raw: unknown) {
  return validar(z.object({ usuario: z.string().trim().toLowerCase().min(1, "Escribe tu usuario."), clave: z.string().min(1, "Escribe tu contraseña.") }), raw);
}

export function usuarioNuevo(raw: unknown) {
  return validar(z.object({ nombre: nombreDePersona, usuario, clave, rol: z.enum(["ADMIN", "EQUIPO"]).default("EQUIPO") }), raw);
}

export function cambiosDeUsuario(raw: unknown) {
  return validar(
    z.object({
      nombre: nombreDePersona.optional(),
      clave: clave.optional(),
      rol: z.enum(["ADMIN", "EQUIPO"]).optional(),
      activo: z.boolean().optional(),
    }),
    raw
  );
}
