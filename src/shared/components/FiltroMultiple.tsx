// src/shared/components/FiltroMultiple.tsx
import { useEffect, useRef, useState } from 'react';

interface Opcion {
  valor: string;
  etiqueta: string;
}

/**
 * Filtro tipo BC: un botón que abre un panel con checkboxes (permite
 * elegir varios valores a la vez, no uno solo como un <select> normal),
 * más un "Restablecer filtros" para limpiar todo de un tiro.
 */
export default function FiltroMultiple({
  seleccionados,
  onCambiar,
  opciones,
  etiqueta,
  className = '',
}: {
  seleccionados: string[];
  onCambiar: (valores: string[]) => void;
  opciones: Opcion[];
  etiqueta: string;
  className?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function alClickFuera(e: MouseEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener('mousedown', alClickFuera);
    return () => document.removeEventListener('mousedown', alClickFuera);
  }, []);

  function alternar(valor: string) {
    onCambiar(
      seleccionados.includes(valor) ? seleccionados.filter((v) => v !== valor) : [...seleccionados, valor]
    );
  }

  const textoBoton =
    seleccionados.length === 0
      ? etiqueta
      : seleccionados.length === 1
      ? (opciones.find((o) => o.valor === seleccionados[0])?.etiqueta ?? etiqueta)
      : `${etiqueta} (${seleccionados.length})`;

  return (
    <div className={`relative ${className}`} ref={contenedorRef}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="w-full rounded-md border border-brand-900/15 bg-white px-3 py-1.5 text-xs text-brand-900
          flex items-center justify-between gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-700"
      >
        <span className="truncate">{textoBoton}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 transition-transform ${abierto ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {abierto && (
        <div className="absolute z-20 mt-1 w-56 rounded-md border border-brand-900/10 bg-white shadow-lg py-1.5">
          <div className="px-3 pb-1.5 mb-1 flex items-center justify-between border-b border-brand-900/8">
            <span className="text-[10.5px] font-medium text-brand-900/40 uppercase tracking-wide">{etiqueta}</span>
            {seleccionados.length > 0 && (
              <button
                type="button"
                onClick={() => onCambiar([])}
                className="text-brand-900/30 hover:text-brand-wine cursor-pointer"
                aria-label="Limpiar selección"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {opciones.map((o) => (
            <label
              key={o.valor}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-brand-900 hover:bg-brand-900/[0.04] cursor-pointer"
            >
              <input
                type="checkbox"
                checked={seleccionados.includes(o.valor)}
                onChange={() => alternar(o.valor)}
                className="h-3.5 w-3.5 accent-brand-700 cursor-pointer"
              />
              {o.etiqueta}
            </label>
          ))}

          <div className="border-t border-brand-900/8 mt-1 pt-1">
            <button
              type="button"
              onClick={() => onCambiar([])}
              className="w-full text-left px-3 py-1.5 text-xs text-brand-700 hover:underline cursor-pointer"
            >
              Restablecer filtros
            </button>
          </div>
        </div>
      )}
    </div>
  );
}