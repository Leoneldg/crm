"use client";

/**
 * /usuarios — quién entra al CRM. Sólo administradores: crear usuarios,
 * cambiarles la contraseña o el rol, y darlos de baja. Un usuario dado
 * de baja no entra más, pero los clientes que cargó siguen con su nombre.
 */
import { useCallback, useEffect, useState } from "react";
import type { Sesion } from "@/lib/sesion";
import type { UsuarioPublico } from "@/lib/usuarios";
import { AvisoProvider, useAviso } from "@/components/Aviso";
import { Encabezado } from "@/components/Encabezado";
import { BOTON, BOTON_SECUNDARIO, CAMPO, ETIQUETA, TARJETA, mensajeDe } from "@/components/comunes";

const ROLES = { ADMIN: "Administrador", EQUIPO: "Equipo" } as const;

function NuevoUsuario({ onCreado }: { onCreado: (u: UsuarioPublico) => void }) {
  const avisar = useAviso();
  const [nombre, setNombre] = useState("");
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [rol, setRol] = useState<"ADMIN" | "EQUIPO">("EQUIPO");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, usuario, clave, rol }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(mensajeDe(res, json, "No se pudo crear el usuario."));
      onCreado(json.data as UsuarioPublico);
      avisar(`Usuario creado: ${usuario.trim().toLowerCase()}`);
      setNombre("");
      setUsuario("");
      setClave("");
      setRol("EQUIPO");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el usuario.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={crear} className={`${TARJETA} space-y-4 p-4 sm:p-5`} autoComplete="off">
      <h2 className="text-[16px] font-extrabold">Nuevo usuario</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={ETIQUETA}>Nombre y apellido</span>
          <input id="nuevo-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required maxLength={120} className={CAMPO} />
        </label>
        <label className="block">
          <span className={ETIQUETA}>Usuario para entrar</span>
          <input id="nuevo-usuario" value={usuario} onChange={(e) => setUsuario(e.target.value)} required maxLength={40} autoCapitalize="off" placeholder="maria.perez" className={CAMPO} />
        </label>
        <label className="block">
          <span className={ETIQUETA}>Contraseña inicial</span>
          <input id="nuevo-clave" type="text" value={clave} onChange={(e) => setClave(e.target.value)} required minLength={8} maxLength={100} className={CAMPO} />
          <span className="mt-1 block text-[12px] text-ink-mute">Al menos 8 caracteres. Pásasela a la persona por un medio privado.</span>
        </label>
        <label className="block">
          <span className={ETIQUETA}>Rol</span>
          <select id="nuevo-rol" value={rol} onChange={(e) => setRol(e.target.value as "ADMIN" | "EQUIPO")} className={CAMPO}>
            <option value="EQUIPO">Equipo: carga y corrige</option>
            <option value="ADMIN">Administrador: además borra y maneja usuarios</option>
          </select>
        </label>
      </div>
      {error && <p className="text-[13px] font-bold text-coral">{error}</p>}
      <button type="submit" disabled={enviando} className={BOTON}>
        {enviando ? "Creando…" : "Crear usuario"}
      </button>
    </form>
  );
}

function FilaDeUsuario({ u, yo, onCambio }: { u: UsuarioPublico; yo: boolean; onCambio: (u: UsuarioPublico) => void }) {
  const avisar = useAviso();
  const [cambiandoClave, setCambiandoClave] = useState(false);
  const [clave, setClave] = useState("");

  async function cambiar(datos: Record<string, unknown>, aviso: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/usuarios/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(mensajeDe(res, json, "No se pudo guardar el cambio."));
      onCambio(json.data as UsuarioPublico);
      avisar(aviso);
      return true;
    } catch (err) {
      avisar(err instanceof Error ? err.message : "No se pudo guardar el cambio.", "mal");
      return false;
    }
  }

  return (
    <li className={`flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5 ${u.activo ? "" : "opacity-60"}`}>
      <div className="min-w-0 flex-1">
        <p className="font-bold">
          {u.nombre} {yo && <span className="text-[12px] font-semibold text-ink-mute">(tú)</span>}
        </p>
        <p className="text-[13px] text-ink-mute">
          {u.usuario} · {ROLES[u.rol]} · {u._count.contactos} cliente{u._count.contactos === 1 ? "" : "s"} cargado{u._count.contactos === 1 ? "" : "s"}
          {!u.activo && " · dado de baja"}
        </p>
      </div>
      {cambiandoClave ? (
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <input
            autoFocus
            type="text"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            minLength={8}
            placeholder="Contraseña nueva"
            aria-label={`Contraseña nueva para ${u.nombre}`}
            className={`${CAMPO} !mt-0 min-w-0 flex-1 sm:w-48`}
          />
          <button
            type="button"
            className={BOTON}
            disabled={clave.length < 8}
            onClick={async () => {
              if (await cambiar({ clave }, `Contraseña cambiada: ${u.usuario}`)) {
                setCambiandoClave(false);
                setClave("");
              }
            }}
          >
            Guardar
          </button>
          <button type="button" className={BOTON_SECUNDARIO} onClick={() => setCambiandoClave(false)}>
            Cancelar
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button type="button" className={BOTON_SECUNDARIO} onClick={() => setCambiandoClave(true)}>
            Cambiar contraseña
          </button>
          {!yo && (
            <>
              <button
                type="button"
                className={BOTON_SECUNDARIO}
                onClick={() => void cambiar({ rol: u.rol === "ADMIN" ? "EQUIPO" : "ADMIN" }, `${u.nombre} ahora es ${u.rol === "ADMIN" ? "Equipo" : "Administrador"}`)}
              >
                {u.rol === "ADMIN" ? "Pasar a Equipo" : "Hacer administrador"}
              </button>
              <button
                type="button"
                className={`${BOTON_SECUNDARIO} ${u.activo ? "!text-coral" : ""}`}
                onClick={() => void cambiar({ activo: !u.activo }, u.activo ? `Dado de baja: ${u.nombre}` : `De nuevo activo: ${u.nombre}`)}
              >
                {u.activo ? "Dar de baja" : "Reactivar"}
              </button>
            </>
          )}
        </div>
      )}
    </li>
  );
}

function Usuarios() {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [usuarios, setUsuarios] = useState<UsuarioPublico[]>([]);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setError(null);
    try {
      const [rs, ru] = await Promise.all([fetch("/api/sesion"), fetch("/api/usuarios")]);
      const [js, ju] = await Promise.all([rs.json().catch(() => null), ru.json().catch(() => null)]);
      if (!rs.ok) throw new Error(mensajeDe(rs, js, "Tu sesión se cerró."));
      if (!ru.ok) throw new Error(mensajeDe(ru, ju, "No se pudo cargar la lista de usuarios."));
      setSesion(js.data as Sesion);
      setUsuarios(ju.data as UsuarioPublico[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar la lista de usuarios.");
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const reemplazar = (u: UsuarioPublico) => setUsuarios((lista) => lista.map((x) => (x.id === u.id ? u : x)));

  return (
    <main className="mx-auto max-w-[860px] space-y-5 px-4 py-5 sm:px-7 sm:py-7">
      <Encabezado sesion={sesion} titulo="Usuarios" volver />
      {error && <p className="rounded-2xl bg-coral-soft px-4 py-3 text-[14px] text-coral">{error}</p>}
      {sesion?.rol === "ADMIN" && (
        <>
          <NuevoUsuario onCreado={(u) => setUsuarios((lista) => [...lista, u])} />
          <ul className={`${TARJETA} divide-y divide-line`}>
            {usuarios.map((u) => (
              <FilaDeUsuario key={u.id} u={u} yo={u.id === sesion.id} onCambio={reemplazar} />
            ))}
          </ul>
        </>
      )}
    </main>
  );
}

export default function UsuariosPage() {
  return (
    <AvisoProvider>
      <Usuarios />
    </AvisoProvider>
  );
}
