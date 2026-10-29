"use client";

/**
 * La carga de un cliente del CRM: casi todo se elige con un toque y lo
 * que se repite de un cliente al siguiente (app, canal, zona, equipo)
 * queda puesto después de guardar.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Icono } from "@/components/Icono";
import { useAviso } from "@/components/Aviso";
import DPA from "@/lib/dpa.json";
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
  fechaCorta,
  posiblesDuplicados,
  type CrmContacto,
  type CrmTipoDeOpcion,
} from "@/lib/crm";
import {
  CAMPO,
  CAMPOS_QUE_SE_MANTIENEN,
  ETIQUETA,
  TARJETA,
  cuerpoDe,
  formularioDe,
  formularioVacio,
  type CampoCrm,
  type CrmFormulario,
  type CrmOpciones,
  mensajeDe,
} from "@/components/comunes";

/** La división político-territorial de Venezuela (la misma de BodegApp):
 *  estado → municipio → parroquias. */
const DIVISION = DPA as Record<string, Record<string, string[]>>;
const NOMBRES_DE_ESTADOS = Object.keys(DIVISION).sort((a, b) => a.localeCompare(b, "es"));

const GUARDADO_LOCAL = "crm.fijos";

function leerFijos(): Partial<CrmFormulario> {
  try {
    const crudo = window.localStorage.getItem(GUARDADO_LOCAL);
    return crudo ? (JSON.parse(crudo) as Partial<CrmFormulario>) : {};
  } catch {
    return {};
  }
}

function guardarFijos(f: CrmFormulario): CrmFormulario {
  const fijos = Object.fromEntries(CAMPOS_QUE_SE_MANTIENEN.map((c) => [c, f[c]])) as Partial<CrmFormulario>;
  try {
    window.localStorage.setItem(GUARDADO_LOCAL, JSON.stringify(fijos));
  } catch {
    /* sin almacenamiento local, simplemente no se recuerda */
  }
  return { ...formularioVacio(), ...fijos, fechaContacto: fijos.fechaContacto || formularioVacio().fechaContacto };
}

const porNombre = (a: string, b: string) => a.localeCompare(b, "es");

function Opciones({
  valores,
  valor,
  onElegir,
  grande,
}: {
  valores: readonly string[];
  valor: string;
  onElegir: (v: string) => void;
  grande?: boolean;
}) {
  return (
    <>
      {valores.map((v) => {
        const activa = valor === v;
        return (
          <button
            key={v}
            type="button"
            aria-pressed={activa}
            onClick={() => onElegir(activa ? "" : v)}
            className={`rounded-full border-[1.5px] font-bold transition-colors ${grande ? "px-4 py-2.5 text-[15px]" : "px-3.5 py-2 text-[14px]"} ${
              activa ? "border-brand bg-brand texto-sobre-brand" : "border-line-strong bg-surface text-ink-soft hover:border-brand"
            }`}
          >
            {v}
          </button>
        );
      })}
    </>
  );
}

/** Una lista que crece desde acá: la app o alguien del equipo. */
function OpcionesQueCrecen({
  tipo,
  valores,
  valor,
  onElegir,
  puedeAgregar,
  onAgregar,
  grande,
}: {
  tipo: CrmTipoDeOpcion;
  valores: readonly string[];
  valor: string;
  onElegir: (v: string) => void;
  puedeAgregar: boolean;
  onAgregar: (tipo: CrmTipoDeOpcion, nombre: string) => Promise<boolean>;
  grande?: boolean;
}) {
  const [agregando, setAgregando] = useState(false);
  const [nombre, setNombre] = useState("");
  const [enviando, setEnviando] = useState(false);
  const lista = valor && !valores.includes(valor) ? [...valores, valor] : valores;

  async function agregar() {
    if (nombre.trim().length < 2) return;
    setEnviando(true);
    const ok = await onAgregar(tipo, nombre);
    setEnviando(false);
    if (ok) {
      setAgregando(false);
      setNombre("");
    }
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      <Opciones valores={lista} valor={valor} onElegir={onElegir} grande={grande} />
      {puedeAgregar &&
        (agregando ? (
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <input
              autoFocus
              value={nombre}
              maxLength={60}
              onChange={(e) => setNombre(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void agregar();
                }
                if (e.key === "Escape") setAgregando(false);
              }}
              placeholder={tipo === "APP" ? "Nombre de la app" : "Nombre y apellido"}
              className={`${CAMPO} !mt-0 min-w-0 flex-1 sm:w-56`}
            />
            <button type="button" disabled={enviando} onClick={() => void agregar()} className="rounded-full bg-brand px-4 py-2 text-[14px] font-bold texto-sobre-brand hover:bg-brand-light disabled:opacity-50">
              Agregar
            </button>
            <button type="button" onClick={() => setAgregando(false)} className="rounded-full px-3 py-2 text-[14px] font-bold text-ink-mute hover:text-ink">
              Cancelar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAgregando(true)}
            className="flex items-center gap-1 rounded-full border-[1.5px] border-dashed border-line-strong px-3.5 py-2 text-[14px] font-bold text-ink-mute hover:border-brand hover:text-brand"
          >
            <Icono nombre="mas" className="h-3.5 w-3.5" />
            {lista.length > 0 ? "Agregar" : tipo === "APP" ? "Agregar app" : "Agregar persona"}
          </button>
        ))}
    </div>
  );
}

function Bloque({ titulo, nota, children }: { titulo: string; nota?: string; children: React.ReactNode }) {
  return (
    <section className={`${TARJETA} space-y-4 p-4 sm:p-5`}>
      <h2 className="flex flex-wrap items-baseline justify-between gap-2 text-[16px] font-extrabold text-ink">
        {titulo}
        {nota && <span className="text-[12px] font-semibold text-ink-mute">{nota}</span>}
      </h2>
      {children}
    </section>
  );
}

export function FormularioCrm({
  opciones,
  contactos,
  editando,
  puedeGuardar,
  puedeAgregarOpciones,
  puedeBorrar,
  onGuardado,
  onBorrado,
  onOpciones,
  onTerminarEdicion,
}: {
  opciones: CrmOpciones;
  contactos: readonly CrmContacto[];
  editando: CrmContacto | null;
  puedeGuardar: boolean;
  puedeAgregarOpciones: boolean;
  puedeBorrar: boolean;
  onGuardado: (c: CrmContacto, eraNuevo: boolean) => void;
  onBorrado: (id: string) => void;
  onOpciones: (o: CrmOpciones) => void;
  onTerminarEdicion: () => void;
}) {
  const avisar = useAviso();
  const [f, setF] = useState<CrmFormulario>(formularioVacio);
  const [masAbierto, setMasAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [confirmandoBorrar, setConfirmandoBorrar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nombreRef = useRef<HTMLInputElement>(null);

  // Al abrir la página, lo que quedó puesto la última vez.
  useEffect(() => {
    setF((actual) => ({ ...actual, ...leerFijos(), fechaContacto: formularioVacio().fechaContacto }));
  }, []);

  // Al tocar un contacto de la lista, se carga acá para corregirlo.
  useEffect(() => {
    if (!editando) return;
    const datos = formularioDe(editando);
    setF(datos);
    setMasAbierto(Boolean(datos.pedido || datos.credito || datos.cobranza || datos.cuentasPendientes || datos.cuotas || datos.olvidoClave || datos.reclamoTipo || datos.reclamo));
    setError(null);
    setConfirmandoBorrar(false);
  }, [editando]);

  const poner = (campo: CampoCrm, valor: string) =>
    setF((actual) => {
      const nuevo = { ...actual, [campo]: valor };
      if (campo === "contactoTipo") {
        if (valor !== "Digital") nuevo.canalDigital = "";
        if (valor !== "Físico") nuevo.canalFisico = "";
      }
      if (campo === "estado") {
        nuevo.municipio = "";
        nuevo.parroquia = "";
      }
      if (campo === "municipio") nuevo.parroquia = "";
      if (campo === "pedido" && valor === "Sí" && !nuevo.fechaPedido) nuevo.fechaPedido = formularioVacio().fechaContacto;
      return nuevo;
    });

  const municipiosDelEstado = DIVISION[f.estado];
  const nombresDeMunicipios = useMemo(() => Object.keys(municipiosDelEstado ?? {}).sort(porNombre), [municipiosDelEstado]);
  const nombresDeParroquias = useMemo(() => [...(municipiosDelEstado?.[f.municipio] ?? [])].sort(porNombre), [municipiosDelEstado, f.municipio]);

  /** Sectores, comunidades y calles ya cargados en la misma zona. */
  const sugerencias = useMemo(() => {
    const cerca = contactos.filter((c) => c.municipio === f.municipio && (!f.parroquia || c.parroquia === f.parroquia));
    const de = (k: "sector" | "comunidad" | "calle") => [...new Set(cerca.map((c) => c[k]).filter((v): v is string => Boolean(v)))].sort(porNombre);
    return { sector: de("sector"), comunidad: de("comunidad"), calle: de("calle") };
  }, [contactos, f.municipio, f.parroquia]);

  const duplicado = useMemo(
    () => posiblesDuplicados(contactos, { ci: f.ci, telefono: f.telefono, telefono2: f.telefono2 }, editando?.id)[0] ?? null,
    [contactos, f.ci, f.telefono, f.telefono2, editando]
  );

  const completo = Boolean(f.app && f.nombre.trim().length >= 2 && (f.telefono.replace(/\D/g, "") || f.ci.replace(/\D/g, "")));

  async function agregarOpcion(tipo: CrmTipoDeOpcion, nombre: string): Promise<boolean> {
    try {
      const res = await fetch("/api/opciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, nombre }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(mensajeDe(res, json, "No se pudo agregar."));
      const nuevas = json.data as CrmOpciones;
      onOpciones(nuevas);
      const limpio = nombre.trim().replace(/\s+/g, " ").toLocaleLowerCase("es");
      const elegido = nuevas[tipo].find((n) => n.toLocaleLowerCase("es") === limpio);
      if (elegido) poner(tipo === "APP" ? "app" : tipo === "PROMOTOR" ? "promotor" : "vendedor", elegido);
      return true;
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se pudo agregar.", "mal");
      return false;
    }
  }

  async function guardar() {
    if (!completo || guardando) return;
    setGuardando(true);
    setError(null);
    try {
      const res = await fetch(editando ? `/api/contactos/${editando.id}` : "/api/contactos", {
        method: editando ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpoDe(f)),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(mensajeDe(res, json, `No se guardó (HTTP ${res.status}). Revisa la conexión y vuelve a tocar Guardar.`));
      const contacto = json.data as CrmContacto;
      onGuardado(contacto, !editando);
      avisar(editando ? `Cambios guardados: ${contacto.nombre}` : `Guardado: ${contacto.nombre}`, "ok");
      setF(guardarFijos(f));
      setMasAbierto(false);
      if (editando) onTerminarEdicion();
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => nombreRef.current?.focus({ preventScroll: true }), 350);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se guardó.");
    } finally {
      setGuardando(false);
    }
  }

  async function borrar() {
    if (!editando) return;
    if (!confirmandoBorrar) {
      setConfirmandoBorrar(true);
      return;
    }
    try {
      const res = await fetch(`/api/contactos/${editando.id}`, { method: "DELETE" });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(mensajeDe(res, json, "No se pudo borrar."));
      onBorrado(editando.id);
      avisar(`Borrado: ${editando.nombre}`, "ok");
      setF(guardarFijos(f));
      onTerminarEdicion();
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se pudo borrar.", "mal");
    } finally {
      setConfirmandoBorrar(false);
    }
  }

  function limpiar() {
    setF(guardarFijos(f));
    setError(null);
    if (editando) onTerminarEdicion();
  }

  const texto = (campo: CampoCrm, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <input id={`crm-${campo}`} value={f[campo]} onChange={(e) => poner(campo, e.target.value)} disabled={!puedeGuardar} className={CAMPO} {...props} />
  );
  const lista = (campo: CampoCrm, valores: readonly string[], vacio: string, deshabilitado = false) => (
    <select id={`crm-${campo}`} value={f[campo]} onChange={(e) => poner(campo, e.target.value)} disabled={!puedeGuardar || deshabilitado} className={CAMPO}>
      <option value="">{vacio}</option>
      {valores.map((v) => (
        <option key={v} value={v}>
          {v}
        </option>
      ))}
      {f[campo] && !valores.includes(f[campo]) && <option value={f[campo]}>{f[campo]}</option>}
    </select>
  );
  const toque = (campo: CampoCrm, valores: readonly string[]) => (
    <div className="mt-2 flex flex-wrap gap-2">
      <Opciones valores={valores} valor={f[campo]} onElegir={(v) => puedeGuardar && poner(campo, v)} />
    </div>
  );

  return (
    <form
      className="space-y-3"
      autoComplete="off"
      onSubmit={(e) => {
        e.preventDefault();
        void guardar();
      }}
    >
      {editando && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-brand-soft px-4 py-3 text-[14px] text-ink">
          <span>
            Corrigiendo a <b>{editando.nombre}</b>
            {editando.cargadoPor ? `, cargado por ${editando.cargadoPor}` : ""}
          </span>
          <button type="button" onClick={limpiar} className="font-bold text-brand hover:underline">
            Dejar de corregir
          </button>
        </div>
      )}

      <Bloque titulo="Origen" nota="Queda puesto para el próximo">
        <div>
          <span className={ETIQUETA}>App / empresa *</span>
          <OpcionesQueCrecen
            tipo="APP"
            grande
            valores={opciones.APP}
            valor={f.app}
            onElegir={(v) => puedeGuardar && poner("app", v)}
            puedeAgregar={puedeAgregarOpciones}
            onAgregar={agregarOpcion}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
          <label className="block">
            <span className={ETIQUETA}>Fecha 1er contacto</span>
            {texto("fechaContacto", { type: "date" })}
          </label>
          <div>
            <span className={ETIQUETA}>1er contacto por</span>
            {toque("contactoTipo", CRM_CONTACTO_TIPOS)}
          </div>
        </div>
        {f.contactoTipo === "Digital" && (
          <div>
            <span className={ETIQUETA}>Canal digital</span>
            {toque("canalDigital", CRM_CANALES_DIGITALES)}
          </div>
        )}
        {f.contactoTipo === "Físico" && (
          <div>
            <span className={ETIQUETA}>Canal físico</span>
            {toque("canalFisico", CRM_CANALES_FISICOS)}
          </div>
        )}
      </Bloque>

      <Bloque titulo="Cliente">
        <label className="block">
          <span className={ETIQUETA}>Nombre y apellido *</span>
          <input
            ref={nombreRef}
            id="crm-nombre"
            value={f.nombre}
            onChange={(e) => poner("nombre", e.target.value)}
            disabled={!puedeGuardar}
            maxLength={160}
            autoCapitalize="words"
            placeholder="María Pérez"
            className={CAMPO}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className={ETIQUETA}>Cédula</span>
            <div className="flex gap-2">
              <select
                aria-label="Tipo de cédula"
                value={f.ciTipo}
                onChange={(e) => poner("ciTipo", e.target.value)}
                disabled={!puedeGuardar}
                className={`${CAMPO} !w-[72px] flex-none`}
              >
                {CRM_CI_TIPOS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              {texto("ci", { inputMode: "numeric", maxLength: 12, placeholder: "12345678" })}
            </div>
          </label>
          <label className="block">
            <span className={ETIQUETA}>Teléfono *</span>
            {texto("telefono", { type: "tel", inputMode: "tel", maxLength: 20, placeholder: "0412-1234567" })}
          </label>
          <label className="block">
            <span className={ETIQUETA}>Otro teléfono</span>
            {texto("telefono2", { type: "tel", inputMode: "tel", maxLength: 20 })}
          </label>
        </div>
        {duplicado && (
          <div className="rounded-xl bg-aviso-soft px-3.5 py-2.5 text-[13px] text-aviso">
            Ya está cargado <b>{duplicado.nombre}</b> con esa cédula o teléfono ({duplicado.app}
            {duplicado.fechaContacto ? `, ${fechaCorta(duplicado.fechaContacto)}` : ""}). Búscalo en Registros si quieres corregirlo en vez de cargarlo otra vez.
          </div>
        )}
        <label className="block">
          <span className={ETIQUETA}>Correo</span>
          {texto("correo", { type: "email", inputMode: "email", autoCapitalize: "off", maxLength: 160 })}
        </label>
      </Bloque>

      <Bloque titulo="Ubicación" nota="Queda puesta para el próximo">
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className={ETIQUETA}>Estado</span>
            {lista("estado", NOMBRES_DE_ESTADOS, "Elige el estado")}
          </label>
          <label className="block">
            <span className={ETIQUETA}>Municipio</span>
            {lista("municipio", nombresDeMunicipios, f.estado ? "Elige el municipio" : "Primero el estado", !f.estado)}
          </label>
          <label className="block">
            <span className={ETIQUETA}>Parroquia</span>
            {lista("parroquia", nombresDeParroquias, f.municipio ? "Elige la parroquia" : "Primero el municipio", !f.municipio)}
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={ETIQUETA}>Sector</span>
            {texto("sector", { list: "crm-sectores", maxLength: 120, placeholder: "Escribe o elige" })}
          </label>
          <label className="block">
            <span className={ETIQUETA}>Comunidad</span>
            {texto("comunidad", { list: "crm-comunidades", maxLength: 120, placeholder: "Escribe o elige" })}
          </label>
          <label className="block">
            <span className={ETIQUETA}>Calle</span>
            {texto("calle", { list: "crm-calles", maxLength: 200 })}
          </label>
          <label className="block">
            <span className={ETIQUETA}>Punto de referencia</span>
            {texto("puntoReferencia", { maxLength: 300, placeholder: "Frente a la panadería" })}
          </label>
        </div>
        <datalist id="crm-sectores">{sugerencias.sector.map((v) => <option key={v} value={v} />)}</datalist>
        <datalist id="crm-comunidades">{sugerencias.comunidad.map((v) => <option key={v} value={v} />)}</datalist>
        <datalist id="crm-calles">{sugerencias.calle.map((v) => <option key={v} value={v} />)}</datalist>
      </Bloque>

      <Bloque titulo="Interés">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <span className={ETIQUETA}>Interesado</span>
            {toque("interesado", CRM_INTERESADO)}
          </div>
          <div>
            <span className={ETIQUETA}>Potencial</span>
            {toque("potencial", CRM_POTENCIAL)}
          </div>
        </div>
        <div>
          <span className={ETIQUETA}>Plan</span>
          {toque("plan", CRM_PLANES)}
        </div>
      </Bloque>

      <Bloque titulo="Equipo" nota="Queda puesto para el próximo">
        <div>
          <span className={ETIQUETA}>Promotor · responsable de atención</span>
          <OpcionesQueCrecen
            tipo="PROMOTOR"
            valores={opciones.PROMOTOR}
            valor={f.promotor}
            onElegir={(v) => puedeGuardar && poner("promotor", v)}
            puedeAgregar={puedeAgregarOpciones}
            onAgregar={agregarOpcion}
          />
        </div>
        <div>
          <span className={ETIQUETA}>Vendedor · responsable</span>
          <OpcionesQueCrecen
            tipo="VENDEDOR"
            valores={opciones.VENDEDOR}
            valor={f.vendedor}
            onElegir={(v) => puedeGuardar && poner("vendedor", v)}
            puedeAgregar={puedeAgregarOpciones}
            onAgregar={agregarOpcion}
          />
        </div>
      </Bloque>

      <section className={TARJETA}>
        <button
          type="button"
          aria-expanded={masAbierto}
          onClick={() => setMasAbierto((v) => !v)}
          className="flex w-full items-center justify-between gap-2 p-4 text-left text-[16px] font-extrabold text-ink sm:p-5"
        >
          Pedido, crédito y cobranza
          <span className="flex items-center gap-1 text-[12px] font-semibold text-ink-mute">
            Opcional
            <Icono nombre={masAbierto ? "arriba" : "abajo"} className="h-4 w-4" />
          </span>
        </button>
        {masAbierto && (
          <div className="space-y-4 px-4 pb-5 sm:px-5">
            <div>
              <span className={ETIQUETA}>Hizo pedido</span>
              {toque("pedido", CRM_SI_NO)}
            </div>
            {f.pedido === "Sí" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={ETIQUETA}>Fecha del pedido</span>
                  {texto("fechaPedido", { type: "date" })}
                </label>
                <label className="block">
                  <span className={ETIQUETA}>Monto ($)</span>
                  {texto("monto", { type: "number", inputMode: "decimal", min: 0, step: "0.01" })}
                </label>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className={ETIQUETA}>Crédito</span>
                {toque("credito", CRM_SI_NO)}
              </div>
              <div>
                <span className={ETIQUETA}>Cobranza</span>
                {toque("cobranza", CRM_COBRANZA)}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={ETIQUETA}>Cuentas pendientes por pagar ($)</span>
                {texto("cuentasPendientes", { type: "number", inputMode: "decimal", min: 0, step: "0.01" })}
              </label>
              <label className="block">
                <span className={ETIQUETA}>Cuotas de pago, abono ($)</span>
                {texto("cuotas", { type: "number", inputMode: "decimal", min: 0, step: "0.01" })}
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className={ETIQUETA}>Olvidó la contraseña</span>
                {toque("olvidoClave", CRM_SI_NO)}
              </div>
              <div>
                <span className={ETIQUETA}>Reclamo</span>
                {toque("reclamoTipo", CRM_RECLAMOS)}
              </div>
            </div>
            <label className="block">
              <span className={ETIQUETA}>Detalle del reclamo</span>
              {texto("reclamo", { maxLength: 500 })}
            </label>
          </div>
        )}
      </section>

      <section className={`${TARJETA} p-4 sm:p-5`}>
        <label className="block">
          <span className={ETIQUETA}>Observaciones</span>
          <textarea
            id="crm-observaciones"
            value={f.observaciones}
            onChange={(e) => poner("observaciones", e.target.value)}
            disabled={!puedeGuardar}
            rows={3}
            maxLength={4000}
            placeholder="Lo que deba saber el próximo que lo atienda"
            className={CAMPO}
          />
        </label>
      </section>

      {puedeGuardar && (
        // Pegada abajo mientras se baja por el formulario: el botón de
        // guardar siempre a mano, sin tener que bajar hasta el final.
        <div className="sticky bottom-0 z-30 -mx-1 pb-[env(safe-area-inset-bottom)] pt-1">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line-strong bg-surface px-4 py-3 shadow-lg">
            <p className={`min-w-0 flex-1 text-[13px] ${error ? "font-bold text-coral" : "text-ink-mute"}`}>
              {error ?? (completo ? "Listo para guardar." : "Mínimo: app, nombre y teléfono o cédula.")}
            </p>
            {editando && puedeBorrar && (
              <button type="button" onClick={() => void borrar()} className="rounded-full px-4 py-2.5 text-[14px] font-bold text-coral hover:bg-coral-soft">
                {confirmandoBorrar ? "¿Seguro? Toca otra vez" : "Borrar"}
              </button>
            )}
            <button type="button" onClick={limpiar} className="rounded-full border-[1.5px] border-line-strong px-4 py-2.5 text-[14px] font-bold text-ink-soft hover:border-brand">
              Limpiar
            </button>
            <button type="submit" disabled={!completo || guardando} className="rounded-full bg-brand px-5 py-2.5 text-[14px] font-bold texto-sobre-brand hover:bg-brand-light disabled:opacity-50">
              {guardando ? "Guardando…" : editando ? "Guardar cambios" : "Guardar y cargar otro"}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
