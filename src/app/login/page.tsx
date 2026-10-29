"use client";

import { useState } from "react";
import { CAMPO, ETIQUETA } from "@/components/comunes";

export default function LoginPage() {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setEntrando(true);
    setError(null);
    try {
      const res = await fetch("/api/sesion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, clave }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error ?? "No se pudo entrar.");
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo entrar.");
      setEntrando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <form onSubmit={entrar} className="w-full max-w-sm space-y-5 rounded-2xl border border-line bg-surface p-6 shadow-sm">
        <div>
          <h1 className="text-[24px] font-extrabold tracking-tight">CRM del equipo</h1>
          <p className="mt-1 text-[14px] text-ink-mute">Entra con el usuario que te dio el administrador.</p>
        </div>
        <label className="block">
          <span className={ETIQUETA}>Usuario</span>
          <input
            id="usuario"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            autoComplete="username"
            autoCapitalize="off"
            autoFocus
            required
            className={CAMPO}
          />
        </label>
        <label className="block">
          <span className={ETIQUETA}>Contraseña</span>
          <input id="clave" type="password" value={clave} onChange={(e) => setClave(e.target.value)} autoComplete="current-password" required className={CAMPO} />
        </label>
        {error && <p className="rounded-xl bg-coral-soft px-3.5 py-2.5 text-[13px] font-semibold text-coral">{error}</p>}
        <button
          type="submit"
          disabled={entrando}
          className="texto-sobre-brand w-full rounded-full bg-brand px-5 py-3 text-[15px] font-bold hover:bg-brand-light disabled:opacity-50"
        >
          {entrando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
