import type { CrmContacto, CrmTipoDeOpcion } from "@/lib/crm";

export type CrmOpciones = Record<CrmTipoDeOpcion, string[]>;

export const CAMPOS_CRM = [
  "app", "fechaContacto", "contactoTipo", "canalDigital", "canalFisico",
  "nombre", "ciTipo", "ci", "telefono", "telefono2", "correo",
  "estado", "municipio", "parroquia", "sector", "comunidad", "calle", "puntoReferencia",
  "interesado", "potencial", "plan", "promotor", "vendedor",
  "pedido", "fechaPedido", "monto", "credito", "cobranza", "cuentasPendientes", "cuotas",
  "olvidoClave", "reclamoTipo", "reclamo", "observaciones",
] as const;
export type CampoCrm = (typeof CAMPOS_CRM)[number];

/** El formulario como lo edita la pantalla: todo texto, "" = vacío. */
export type CrmFormulario = Record<CampoCrm, string>;

/** Lo que queda puesto después de guardar: quien carga veinte clientes
 *  del mismo sector, en la misma jornada, sólo escribe nombre, cédula y
 *  teléfono de cada uno. */
export const CAMPOS_QUE_SE_MANTIENEN: readonly CampoCrm[] = [
  "app", "fechaContacto", "contactoTipo", "canalDigital", "canalFisico",
  "estado", "municipio", "parroquia", "sector", "comunidad", "promotor", "vendedor",
];

const MONTOS: readonly CampoCrm[] = ["monto", "cuentasPendientes", "cuotas"];

export function hoy(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

export function formularioVacio(): CrmFormulario {
  const f = Object.fromEntries(CAMPOS_CRM.map((c) => [c, ""])) as CrmFormulario;
  return { ...f, ciTipo: "V", fechaContacto: hoy() };
}

export function formularioDe(c: CrmContacto): CrmFormulario {
  const f = formularioVacio();
  for (const campo of CAMPOS_CRM) {
    const v = c[campo];
    f[campo] = v === null || v === undefined ? "" : String(v);
  }
  return f;
}

/** Lo que se manda a la API: "" pasa a null y los montos a número. */
export function cuerpoDe(f: CrmFormulario): Record<string, string | number | null> {
  const salida: Record<string, string | number | null> = {};
  for (const campo of CAMPOS_CRM) {
    const v = f[campo].trim();
    salida[campo] = v === "" ? null : MONTOS.includes(campo) ? Number(v.replace(",", ".")) : v;
  }
  return salida;
}

/** El mensaje de error de la API, o el que se pase. Si la sesión se
 *  cerró, manda a entrar de nuevo. */
export function mensajeDe(res: Response, json: unknown, porDefecto: string): string {
  if (res.status === 401 && typeof window !== "undefined") window.location.href = "/login";
  const e = (json as { error?: unknown } | null)?.error;
  return typeof e === "string" && e ? e : porDefecto;
}

export const TARJETA = "rounded-2xl border border-line bg-surface";
export const ETIQUETA = "block text-[12px] font-bold text-ink-mute";
export const CAMPO =
  "mt-1 w-full rounded-xl border-[1.5px] border-line-strong bg-surface px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/15 disabled:opacity-50";
export const BOTON = "texto-sobre-brand rounded-full bg-brand px-5 py-2.5 text-[14px] font-bold hover:bg-brand-light disabled:opacity-50";
export const BOTON_SECUNDARIO = "rounded-full border-[1.5px] border-line-strong px-4 py-2.5 text-[14px] font-bold text-ink-soft hover:border-brand";
