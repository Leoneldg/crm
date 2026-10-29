/**
 * CRM: los clientes de todas las apps (BodegApp, Merk2, Pregonero de la
 * Suerte…), uno por registro.
 *
 * Reemplaza la planilla "CRM 2.xlsx" que el equipo llenaba a mano. Las
 * columnas son las mismas, pero casi todas pasan a ser opciones de un
 * toque. Las de abajo son fijas; las apps y la gente del equipo crecen
 * desde la pantalla (CrmOpcion).
 *
 * Puro: lo usan la API para validar, la pantalla para dibujar
 * los botones y la descarga para armar el Excel.
 */

export const CRM_SI_NO = ["Sí", "No"] as const;
export const CRM_CONTACTO_TIPOS = ["Digital", "Físico"] as const;
export const CRM_CANALES_DIGITALES = ["WhatsApp", "Instagram", "Facebook", "TikTok", "Página web", "Llamada", "Correo"] as const;
export const CRM_CANALES_FISICOS = ["Visita en sitio", "Calle / volanteo", "Referido", "Evento", "Oficina"] as const;
export const CRM_INTERESADO = ["Sí", "No", "Lo pensará"] as const;
export const CRM_POTENCIAL = ["Alto", "Medio", "Bajo"] as const;
export const CRM_PLANES = ["Básico", "Evolución", "Aliado", "Socio C"] as const;
export const CRM_COBRANZA = ["Al día", "Pendiente", "Vencida"] as const;
export const CRM_RECLAMOS = ["Ninguno", "Pedido", "Pago", "App", "Atención", "Otro"] as const;
export const CRM_CI_TIPOS = ["V", "E", "J"] as const;

/** Las listas que se agregan desde la pantalla. */
export const CRM_TIPOS_DE_OPCION = ["APP", "PROMOTOR", "VENDEDOR"] as const;
export type CrmTipoDeOpcion = (typeof CRM_TIPOS_DE_OPCION)[number];

/** Lo que se carga de un cliente. Fechas como "AAAA-MM-DD"; los montos,
 *  en dólares. Todo lo que no es app y nombre puede faltar. */
export interface CrmDatos {
  readonly app: string;
  readonly fechaContacto: string | null;
  readonly contactoTipo: string | null;
  readonly canalDigital: string | null;
  readonly canalFisico: string | null;
  readonly nombre: string;
  readonly ciTipo: string | null;
  readonly ci: string | null;
  readonly telefono: string | null;
  readonly telefono2: string | null;
  readonly correo: string | null;
  readonly estado: string | null;
  readonly municipio: string | null;
  readonly parroquia: string | null;
  readonly sector: string | null;
  readonly comunidad: string | null;
  readonly calle: string | null;
  readonly puntoReferencia: string | null;
  readonly interesado: string | null;
  readonly potencial: string | null;
  readonly plan: string | null;
  readonly promotor: string | null;
  readonly vendedor: string | null;
  readonly pedido: string | null;
  readonly fechaPedido: string | null;
  readonly monto: number | null;
  readonly credito: string | null;
  readonly cobranza: string | null;
  readonly cuentasPendientes: number | null;
  readonly cuotas: number | null;
  readonly olvidoClave: string | null;
  readonly reclamoTipo: string | null;
  readonly reclamo: string | null;
  readonly observaciones: string | null;
}

export interface CrmContacto extends CrmDatos {
  readonly id: string;
  /** Nombre de quien lo cargó; null si ya no está o no se sabe. */
  readonly cargadoPor: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

const soloDigitos = (s: string | null | undefined): string => (s ?? "").replace(/\D/g, "");

/**
 * Los contactos que ya tienen esa cédula o alguno de esos teléfonos,
 * en cualquier app: el mismo cliente puede llegar por BodegApp y por
 * Merk2, y conviene verlo antes de cargarlo dos veces. Una cédula de
 * menos de 6 cifras o un teléfono de menos de 7 no cuentan: a medio
 * escribir coincidirían con medio mundo.
 */
export function posiblesDuplicados(
  contactos: readonly CrmContacto[],
  datos: Pick<CrmDatos, "ci" | "telefono" | "telefono2">,
  excepto?: string
): CrmContacto[] {
  const ci = soloDigitos(datos.ci);
  const telefonos = [datos.telefono, datos.telefono2].map(soloDigitos).filter((t) => t.length >= 7);
  if (ci.length < 6 && telefonos.length === 0) return [];
  return contactos.filter((c) => {
    if (c.id === excepto) return false;
    if (ci.length >= 6 && soloDigitos(c.ci) === ci) return true;
    const suyos = [c.telefono, c.telefono2].map(soloDigitos);
    return telefonos.some((t) => suyos.includes(t));
  });
}

/** "2026-10-29" → "29/10/2026", como se lee en Venezuela. */
export function fechaCorta(iso: string | null | undefined): string {
  if (!iso) return "";
  const [a, m, d] = iso.slice(0, 10).split("-");
  return a && m && d ? `${d}/${m}/${a}` : "";
}

type Celda = string | number;

/** Las columnas del Excel, en el orden de la planilla "CRM 2.xlsx". Los
 *  cuatro planes van en columnas aparte con una X, como antes. */
const COLUMNAS: ReadonlyArray<readonly [string, (c: CrmContacto, i: number) => Celda | null]> = [
  ["N°", (_c, i) => i + 1],
  ["EMPRESA", (c) => c.app],
  ["CLIENTE", (c) => c.nombre],
  ["CI", (c) => (c.ci ? `${c.ciTipo ?? "V"}-${c.ci}` : null)],
  ["TELEFONO", (c) => c.telefono],
  ["TELEFONO 2", (c) => c.telefono2],
  ["CORREO", (c) => c.correo],
  ["ESTADO", (c) => c.estado],
  ["MUNICIPIO", (c) => c.municipio],
  ["PARROQUIA", (c) => c.parroquia],
  ["SECTOR", (c) => c.sector],
  ["COMUNIDAD", (c) => c.comunidad],
  ["CALLE", (c) => c.calle],
  ["PUNTO DE REFERENCIA", (c) => c.puntoReferencia],
  ["FECHA 1ER CONTACTO", (c) => fechaCorta(c.fechaContacto)],
  ["1ER CONTACTO", (c) => c.contactoTipo],
  ["CANALES DIG", (c) => c.canalDigital],
  ["CANAL FISICO", (c) => c.canalFisico],
  ["INTERESADO", (c) => c.interesado],
  ["POTENCIAL", (c) => c.potencial],
  ["P. BASICO", (c) => (c.plan === "Básico" ? "X" : null)],
  ["P. EVOLUCION", (c) => (c.plan === "Evolución" ? "X" : null)],
  ["P. ALIADO", (c) => (c.plan === "Aliado" ? "X" : null)],
  ["P. SOCIO C", (c) => (c.plan === "Socio C" ? "X" : null)],
  ["PROMOTOR - RESPONSABLE DE ATENCION", (c) => c.promotor],
  ["VENDEDOR - RESPONSABLE", (c) => c.vendedor],
  ["PEDIDO", (c) => c.pedido],
  ["FECHA", (c) => fechaCorta(c.fechaPedido)],
  ["MONTO", (c) => c.monto],
  ["CRÉDITO", (c) => c.credito],
  ["COBRANZA", (c) => c.cobranza],
  ["CUENTAS PENDIENTES POR PAGAR", (c) => c.cuentasPendientes],
  ["CUOTAS DE PAGO (ABONO)", (c) => c.cuotas],
  ["OLVIDO DE CONTRASEÑA", (c) => c.olvidoClave],
  ["RECLAMOS", (c) => [c.reclamoTipo && c.reclamoTipo !== "Ninguno" ? c.reclamoTipo : null, c.reclamo].filter(Boolean).join(": ") || null],
  ["OBSERVACIONES", (c) => c.observaciones],
  ["CARGADO POR", (c) => c.cargadoPor],
];

/** La planilla lista para el Excel: la cabecera y una fila por
 *  contacto, del más viejo al más nuevo. */
export function planillaCrm(contactos: readonly CrmContacto[]): Celda[][] {
  const ordenados = [...contactos].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return [COLUMNAS.map(([titulo]) => titulo), ...ordenados.map((c, i) => COLUMNAS.map(([, valor]) => valor(c, i) ?? ""))];
}

/** Para buscar sin que importen acentos ni mayúsculas: "Pérez" = "perez". */
export function normalizar(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}
