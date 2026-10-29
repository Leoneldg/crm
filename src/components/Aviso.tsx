"use client";

/** El aviso corto de abajo: "Guardado: María Pérez". */
import { createContext, useCallback, useContext, useRef, useState } from "react";

type Tipo = "ok" | "mal";
const Contexto = createContext<(mensaje: string, tipo?: Tipo) => void>(() => {});

export function AvisoProvider({ children }: { children: React.ReactNode }) {
  const [mensaje, setMensaje] = useState("");
  const [tipo, setTipo] = useState<Tipo>("ok");
  const [visible, setVisible] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  const avisar = useCallback((m: string, t: Tipo = "ok") => {
    if (temporizador.current) clearTimeout(temporizador.current);
    setMensaje(m);
    setTipo(t);
    setVisible(true);
    temporizador.current = setTimeout(() => setVisible(false), 2600);
  }, []);

  return (
    <Contexto.Provider value={avisar}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className={`fixed inset-x-4 top-[calc(env(safe-area-inset-top)+12px)] z-50 mx-auto max-w-[480px] rounded-xl px-4 py-3 text-center text-[14px] font-semibold shadow-lg transition-all duration-200 motion-reduce:transition-none ${
          visible ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
        } ${tipo === "mal" ? "bg-coral texto-sobre-brand" : "texto-sobre-brand bg-brand"}`}
      >
        {mensaje}
      </div>
    </Contexto.Provider>
  );
}

export function useAviso() {
  return useContext(Contexto);
}
