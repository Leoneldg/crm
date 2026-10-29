"use client";

/**
 * El CRM: la pestaña Cargar es el formulario de un toque, y Registros
 * la lista con la descarga a Excel en las columnas de la vieja planilla.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CrmContacto } from "@/lib/crm";
import type { Sesion } from "@/lib/sesion";
import { AvisoProvider } from "@/components/Aviso";
import { Encabezado } from "@/components/Encabezado";
import { FormularioCrm } from "@/components/FormularioCrm";
import { ListaCrm } from "@/components/ListaCrm";
import { hoy, mensajeDe, type CrmOpciones } from "@/components/comunes";

const SIN_OPCIONES: CrmOpciones = { APP: [], PROMOTOR: [], VENDEDOR: [] };

export default function CrmPage() {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [vista, setVista] = useState<"cargar" | "registros">("cargar");
  const [contactos, setContactos] = useState<CrmContacto[]>([]);
  const [opciones, setOpciones] = useState<CrmOpciones>(SIN_OPCIONES);
  const [editando, setEditando] = useState<CrmContacto | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [rs, rc] = await Promise.all([fetch("/api/sesion"), fetch("/api/contactos")]);
      const [js, jc] = await Promise.all([rs.json().catch(() => null), rc.json().catch(() => null)]);
      if (!rs.ok) throw new Error(mensajeDe(rs, js, "Tu sesión se cerró."));
      if (!rc.ok) throw new Error(mensajeDe(rc, jc, `No se pudo cargar el CRM (HTTP ${rc.status}).`));
      setSesion(js.data as Sesion);
      setContactos(jc.data.contactos as CrmContacto[]);
      setOpciones(jc.data.opciones as CrmOpciones);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el CRM.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const resumen = useMemo(() => {
    const hoyIso = hoy();
    const deHoy = contactos.filter((c) => {
      const d = new Date(c.createdAt);
      return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10) === hoyIso;
    }).length;
    const porApp = new Map<string, number>();
    for (const c of contactos) porApp.set(c.app, (porApp.get(c.app) ?? 0) + 1);
    return { deHoy, porApp: [...porApp.entries()].sort((a, b) => b[1] - a[1]) };
  }, [contactos]);

  return (
    <AvisoProvider>
      <main className="mx-auto max-w-[860px] px-4 py-5 sm:px-7 sm:py-7">
        <Encabezado sesion={sesion} titulo="CRM" />
        <p className="mt-1 text-[14px] text-ink-mute">Los clientes de todas las apps. Toca las opciones y escribe sólo lo necesario.</p>

        {contactos.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5 text-[12px]">
            {[["Total", contactos.length] as const, ["Cargados hoy", resumen.deHoy] as const, ...resumen.porApp].map(([etiqueta, n]) => (
              <span key={etiqueta} className="rounded-full border border-line bg-surface px-3 py-1 text-ink-mute">
                {etiqueta} <b className="tabular-nums text-ink">{n}</b>
              </span>
            ))}
          </div>
        )}

        <div role="tablist" className="mt-5 flex gap-1 border-b border-line">
          {(
            [
              ["cargar", editando ? "Corregir" : "Cargar"],
              ["registros", `Registros (${contactos.length})`],
            ] as const
          ).map(([v, texto]) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={vista === v}
              onClick={() => setVista(v)}
              className={`-mb-px border-b-2 px-4 py-2.5 text-[14px] font-bold ${
                vista === v ? "border-brand text-brand" : "border-transparent text-ink-mute hover:text-ink-soft"
              }`}
            >
              {texto}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-coral-soft px-4 py-3 text-[14px] text-coral">
            {error}
            <button type="button" onClick={() => void cargar()} className="font-bold underline">
              Reintentar
            </button>
          </div>
        )}

        <div className="mt-5">
          {vista === "cargar" ? (
            <FormularioCrm
              opciones={opciones}
              contactos={contactos}
              editando={editando}
              puedeGuardar={Boolean(sesion) && !cargando}
              puedeAgregarOpciones={Boolean(sesion)}
              puedeBorrar={sesion?.rol === "ADMIN"}
              onGuardado={(c, eraNuevo) => setContactos((lista) => (eraNuevo ? [c, ...lista] : lista.map((x) => (x.id === c.id ? c : x))))}
              onBorrado={(id) => setContactos((lista) => lista.filter((x) => x.id !== id))}
              onOpciones={setOpciones}
              onTerminarEdicion={() => setEditando(null)}
            />
          ) : cargando ? (
            <p className="p-8 text-center text-sm text-ink-mute">Cargando clientes…</p>
          ) : (
            <ListaCrm
              contactos={contactos}
              apps={opciones.APP}
              onAbrir={(c) => {
                setEditando(c);
                setVista("cargar");
                window.scrollTo({ top: 0 });
              }}
            />
          )}
        </div>
      </main>
    </AvisoProvider>
  );
}
