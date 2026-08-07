import { useState } from 'react';

function IconoInfo({ className = '' }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

/**
 * Ícono de info que muestra la observación del admin en una burbuja
 * flotante (position: absolute) en vez de como texto fijo debajo del
 * campo -> eso último empujaba el alto de la fila en la grilla y
 * desalineaba todo lo de al lado. Con esto la grilla queda pareja
 * siempre, sin importar cuántos campos tengan observación.
 *
 * Solo con hover (mouseenter/mouseleave) -> antes tenía además un
 * onClick que competía con el hover (el hover la abría y el clic
 * inmediatamente la volvía a cerrar). Con solo hover no hay conflicto.
 */
export default function TooltipObservacion({ texto }: { texto: string | null }) {
  const [abierto, setAbierto] = useState(false);

  if (!texto) return null;

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setAbierto(true)}
      onMouseLeave={() => setAbierto(false)}
    >
      <span
        aria-label="Ver observación del admin"
        className="h-4 w-4 rounded-full flex items-center justify-center text-brand-700 hover:bg-brand-700/10 shrink-0 cursor-help"
      >
        <IconoInfo />
      </span>

      {abierto && (
        <span
          role="tooltip"
          className="absolute z-20 left-1/2 -translate-x-1/2 top-full mt-1.5 w-56 rounded-md bg-brand-900 px-2.5 py-1.5
            text-[12px] leading-snug text-white shadow-lg"
        >
          <span className="font-semibold">Observación:</span> {texto}
          <span className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rotate-45 bg-brand-900" />
        </span>
      )}
    </span>
  );
}