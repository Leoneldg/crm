"use client";

/**
 * Los clientes ya cargados: buscar, filtrar por app, abrir uno para
 * corregirlo y bajar el Excel con las columnas de la planilla CRM.
 */
import { useMemo, useState } from "react";
import { Icono } from "@/components/Icono";
import { fechaCorta, normalizar, planillaCrm, type CrmContacto } from "@/lib/crm";
import { CAMPO, TARJETA } from "@/components/comunes";
import { useAviso } from "@/components/Aviso";

/** Real .xlsx y no CSV: el Excel en español abre un CSV con comas en
 *  una sola columna. */
async function descargarExcel(contactos: readonly CrmContacto[], app: string): Promise<void> {
  const XLSX = await import("xlsx");
  const filas = planillaCrm(contactos);
  const hoja = XLSX.utils.aoa_to_sheet(filas);
  hoja["!cols"] = (filas[0] ?? []).map((titulo) => ({ wch: Math.max(8, Math.min(34, String(titulo).length + 2)) }));
  if (hoja["!ref"]) hoja["!autofilter"] = { ref: hoja["!ref"] };
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, "CRM");
  const fecha = new Date().toISOString().slice(0, 10);
  const etiqueta = app ? `_${app.normalize("NFD").replace(/\p{M}/gu, "").replace(/[^A-Za-z0-9]+/g, "_")}` : "";
  XLSX.writeFile(libro, `CRM${etiqueta}_${fecha}.xlsx`);
}

export function ListaCrm({
  contactos,
  apps,
  onAbrir,
}: {
  contactos: readonly CrmContacto[];
  apps: readonly string[];
  onAbrir: (c: CrmContacto) => void;
}) {
  const avisar = useAviso();
  const [busqueda, setBusqueda] = useState("");
  const [app, setApp] = useState("");
  const [bajando, setBajando] = useState(false);

  const todasLasApps = useMemo(
    () => [...new Set([...apps, ...contactos.map((c) => c.app)])].sort((a, b) => a.localeCompare(b, "es")),
    [apps, contactos]
  );

  const visibles = useMemo(() => {
    const q = normalizar(busqueda);
    return contactos.filter(
      (c) =>
        (!app || c.app === app) &&
        (q === "" ||
          normalizar([c.nombre, c.ci ?? "", c.telefono ?? "", c.telefono2 ?? "", c.correo ?? "", c.sector ?? "", c.comunidad ?? "", c.parroquia ?? "", c.municipio ?? ""].join(" ")).includes(q))
    );
  }, [contactos, busqueda, app]);

  async function bajar() {
    if (visibles.length === 0) return;
    setBajando(true);
    try {
      await descargarExcel(visibles, app);
    } catch {
      avisar("No se pudo armar el Excel. Vuelve a intentarlo.", "mal");
    } finally {
      setBajando(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Icono nombre="buscar" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, cédula, teléfono o sector"
            className={`${CAMPO} !mt-0 pl-10`}
          />
        </div>
        <select aria-label="Filtrar por app" value={app} onChange={(e) => setApp(e.target.value)} className={`${CAMPO} !mt-0 !w-auto`}>
          <option value="">Todas las apps</option>
          {todasLasApps.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void bajar()}
          disabled={bajando || visibles.length === 0}
          className="flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-[14px] font-bold texto-sobre-brand hover:bg-brand-light disabled:opacity-50"
        >
          <Icono nombre="descargar" className="h-4 w-4" />
          {bajando ? "Armando…" : `Descargar Excel (${visibles.length})`}
        </button>
      </div>

      <div className={`${TARJETA} overflow-x-auto`}>
        {visibles.length === 0 ? (
          <p className="p-8 text-center text-[14px] text-ink-mute">
            {contactos.length === 0 ? "Todavía no hay clientes cargados. Ve a Cargar y guarda el primero." : "Ningún cliente coincide con la búsqueda."}
          </p>
        ) : (
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b border-line text-left text-[11px] font-bold uppercase tracking-wide text-ink-mute">
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">App</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3">Zona</th>
                <th className="px-4 py-3">Interés</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">1er contacto</th>
                <th className="px-4 py-3">Cargado por</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((c) => (
                <tr key={c.id} onClick={() => onAbrir(c)} className="cursor-pointer border-b border-line last:border-0 hover:bg-brand-soft">
                  <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">{c.nombre}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{c.app}</td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-ink-soft">{c.telefono ?? "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{[c.sector, c.parroquia, c.municipio].filter(Boolean).join(", ") || "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {c.interesado || c.potencial ? (
                      <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-bold ${c.interesado === "Sí" ? "bg-verde-soft text-verde" : "bg-bg text-ink-soft"}`}>
                        {[c.interesado, c.potencial].filter(Boolean).join(" · ")}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{c.plan ?? "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-ink-soft">{fechaCorta(c.fechaContacto) || "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{c.cargadoPor ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
