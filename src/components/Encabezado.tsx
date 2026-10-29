"use client";

import Link from "next/link";
import { Icono } from "@/components/Icono";
import type { Sesion } from "@/lib/sesion";

async function salir() {
  await fetch("/api/sesion", { method: "DELETE" }).catch(() => null);
  window.location.href = "/login";
}

export function Encabezado({ sesion, titulo, volver }: { sesion: Sesion | null; titulo: string; volver?: boolean }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {volver && (
          <Link href="/" aria-label="Volver al CRM" className="rounded-full p-1.5 text-ink-mute hover:bg-brand-soft hover:text-brand">
            <Icono nombre="volver" className="h-5 w-5" />
          </Link>
        )}
        <h1 className="text-[26px] font-extrabold tracking-tight">{titulo}</h1>
      </div>
      {sesion && (
        <div className="flex flex-wrap items-center gap-1 text-[13px]">
          <span className="px-2 text-ink-mute">{sesion.nombre}</span>
          {sesion.rol === "ADMIN" && !volver && (
            <Link href="/usuarios" className="flex items-center gap-1.5 rounded-full px-3 py-1.5 font-bold text-ink-soft hover:bg-brand-soft hover:text-brand">
              <Icono nombre="usuarios" />
              Usuarios
            </Link>
          )}
          <button type="button" onClick={() => void salir()} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 font-bold text-ink-soft hover:bg-brand-soft hover:text-brand">
            <Icono nombre="salir" />
            Salir
          </button>
        </div>
      )}
    </header>
  );
}
