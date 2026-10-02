import { useEffect, useRef, useState } from 'react';

export interface AccionFila {
  etiqueta: string;
  onClick: () => void;
  /** 'peligro' pinta la acción en vino (inactivar); 'bien', en verde. */
  tono?: 'normal' | 'peligro' | 'bien';
  cargando?: boolean;
}

function IconoPuntos() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
    </svg>
  );
}

const TONOS: Record<string, string> = {
  normal: 'text-brand-900/80',
  peligro: 'text-brand-wine',
  bien: 'text-emerald-700',
};

/**
 * Las acciones de una fila, detrás de un botón de tres puntos.
 *
 * POR QUÉ UN MENÚ Y NO LOS BOTONES SUELTOS: eran cuatro botones de texto
 * en la última columna y no entraban, así que se partían en tres renglones
 * y cada fila de la tabla medía el triple de alto. Con veinte proveedores
 * en pantalla eso es scroll puro. Acá la fila ocupa un renglón y las
 * acciones siguen a un clic.
 */
export default function MenuAcciones({ acciones }: { acciones: AccionFila[] }) {
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

  // Escape cierra, como el resto de los desplegables del portal.
  useEffect(() => {
    function alPresionar(e: KeyboardEvent) {
      if (e.key === 'Escape') setAbierto(false);
    }
    document.addEventListener('keydown', alPresionar);
    return () => document.removeEventListener('keydown', alPresionar);
  }, []);

  return (
    <div ref={contenedorRef} className="relative inline-block">
      <button
        onClick={() => setAbierto((v) => !v)}
        className="flex items-center justify-center h-8 w-8 rounded-md text-brand-900/45 hover:bg-brand-900/[0.06] hover:text-brand-900 transition-colors"
        aria-label="Acciones"
        aria-expanded={abierto}
      >
        <IconoPuntos />
      </button>

      {abierto && (
        <div className="absolute right-0 top-full mt-1 z-20 min-w-[180px] rounded-md border border-brand-900/10 bg-white py-1 shadow-lg">
          {acciones.map((accion) => (
            <button
              key={accion.etiqueta}
              disabled={accion.cargando}
              onClick={() => {
                setAbierto(false);
                accion.onClick();
              }}
              className={`flex w-full items-center justify-between gap-3 px-3.5 py-2 text-left text-sm hover:bg-brand-200/30 disabled:opacity-50 ${
                TONOS[accion.tono ?? 'normal']
              }`}
            >
              {accion.etiqueta}
              {accion.cargando && (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-brand-900/20 border-t-brand-900/60" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
