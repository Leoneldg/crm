/** Los pocos íconos que usa el CRM, de trazo, del color del texto. */
const TRAZOS = {
  mas: "M12 5v14M5 12h14",
  buscar: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4",
  abajo: "M6 9l6 6 6-6",
  arriba: "M6 15l6-6 6 6",
  descargar: "M12 4v11M7 10l5 5 5-5M5 20h14",
  salir: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10",
  usuarios: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21c0-4 3-6 7-6s7 2 7 6M17 3.5a4 4 0 0 1 0 7.5M22 21c0-3-1.5-5-4-5.7",
  volver: "M15 6l-6 6 6 6",
} as const;

export type NombreDeIcono = keyof typeof TRAZOS;

export function Icono({ nombre, className = "h-4 w-4" }: { nombre: NombreDeIcono; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={TRAZOS[nombre]} />
    </svg>
  );
}
