import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export type IconoAccion =
  | 'editar'
  | 'empresa'
  | 'correo'
  | 'enlace'
  | 'desbloquear'
  | 'activar'
  | 'inactivar'
  | 'eliminar';

export interface AccionFila {
  etiqueta: string;
  onClick: () => void;
  icono?: IconoAccion;
  /**
   * 'peligro' pinta la acción en vino y la manda al final del menú,
   * separada por una línea: inactivar o eliminar no pueden quedar pegados
   * a "Editar", donde un clic distraído cae en el lugar equivocado.
   */
  tono?: 'normal' | 'peligro' | 'bien';
  cargando?: boolean;
  /** Una línea corta debajo de la etiqueta, para acciones que no se explican solas. */
  ayuda?: string;
}

const ICONOS: Record<IconoAccion, ReactNode> = {
  editar: <path d="M12 20h9M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z" />,
  empresa: (
    <>
      <path d="M3 21h18M5 21V7l7-4 7 4v14" />
      <path d="M9 9h1m4 0h1M9 13h1m4 0h1M9 17h1m4 0h1" />
    </>
  ),
  correo: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  enlace: (
    <>
      <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
    </>
  ),
  desbloquear: (
    <>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 7.8-1.2" />
    </>
  ),
  activar: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </>
  ),
  inactivar: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m5.6 5.6 12.8 12.8" />
    </>
  ),
  eliminar: (
    <>
      <path d="M4 7h16M10 11v6M14 11v6" />
      <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
    </>
  ),
};

const TONOS: Record<string, string> = {
  normal: 'text-brand-900 hover:bg-brand-200/40',
  peligro: 'text-brand-wine hover:bg-brand-wine/[0.06]',
  bien: 'text-emerald-700 hover:bg-emerald-50',
};

const ANCHO_MENU = 236;
const ALTO_ITEM = 40;

interface Posicion {
  top: number;
  left: number;
  haciaArriba: boolean;
}

/**
 * Las acciones de una fila, detrás de un botón de tres puntos.
 *
 * EL MENÚ SE DIBUJA FUERA DE LA TABLA, en un portal sobre document.body.
 * Antes vivía adentro, con position: absolute, y la tabla está metida en
 * un contenedor con overflow (para el scroll horizontal) dentro de una
 * tarjeta con overflow-hidden. Con pocas filas -una sola, al buscar un
 * proveedor puntual- el menú no entraba: quedaba cortado y había que
 * hacer scroll DENTRO de la tabla para ver las opciones. Desde el portal,
 * ningún overflow lo puede recortar.
 *
 * SE ABRE HACIA ARRIBA si abajo no hay lugar (la última fila de una tabla
 * larga, o la pantalla chica). Y se cierra al hacer scroll o cambiar el
 * tamaño de la ventana: un menú flotando sobre una fila que ya se movió
 * confunde más que obligar a abrirlo de nuevo.
 */
export default function MenuAcciones({ acciones }: { acciones: AccionFila[] }) {
  const [posicion, setPosicion] = useState<Posicion | null>(null);
  const botonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const abierto = posicion !== null;

  // Las de peligro, siempre al final y separadas.
  const normales = acciones.filter((a) => a.tono !== 'peligro');
  const peligrosas = acciones.filter((a) => a.tono === 'peligro');

  function cerrar() {
    setPosicion(null);
  }

  function abrir() {
    const boton = botonRef.current;
    if (!boton) return;

    const caja = boton.getBoundingClientRect();
    const filasConAyuda = acciones.filter((a) => a.ayuda).length;
    const altoEstimado =
      acciones.length * ALTO_ITEM + filasConAyuda * 16 + (peligrosas.length > 0 ? 9 : 0) + 12;

    const espacioAbajo = window.innerHeight - caja.bottom;
    const haciaArriba = espacioAbajo < altoEstimado + 12 && caja.top > espacioAbajo;

    setPosicion({
      top: haciaArriba ? caja.top - 6 : caja.bottom + 6,
      // Alineado al borde derecho del botón, sin salirse por la izquierda.
      left: Math.max(8, caja.right - ANCHO_MENU),
      haciaArriba,
    });
  }

  useEffect(() => {
    if (!abierto) return;

    function alClickFuera(e: MouseEvent) {
      const objetivo = e.target as Node;
      // Hay que mirar los DOS: el menú ya no es hijo del botón.
      if (menuRef.current?.contains(objetivo) || botonRef.current?.contains(objetivo)) return;
      cerrar();
    }

    function alPresionar(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        cerrar();
        botonRef.current?.focus();
      }
    }

    document.addEventListener('mousedown', alClickFuera);
    document.addEventListener('keydown', alPresionar);
    // true: también el scroll de contenedores internos, no solo el de la página.
    window.addEventListener('scroll', cerrar, true);
    window.addEventListener('resize', cerrar);

    return () => {
      document.removeEventListener('mousedown', alClickFuera);
      document.removeEventListener('keydown', alPresionar);
      window.removeEventListener('scroll', cerrar, true);
      window.removeEventListener('resize', cerrar);
    };
  }, [abierto]);

  function renderAccion(accion: AccionFila) {
    return (
      <button
        key={accion.etiqueta}
        role="menuitem"
        disabled={accion.cargando}
        onClick={() => {
          cerrar();
          accion.onClick();
        }}
        className={`flex w-full items-start gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors disabled:opacity-50 ${
          TONOS[accion.tono ?? 'normal']
        }`}
      >
        {accion.icono && (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mt-0.5 shrink-0 opacity-70"
          >
            {ICONOS[accion.icono]}
          </svg>
        )}
        <span className="min-w-0 flex-1">
          <span className="block">{accion.etiqueta}</span>
          {accion.ayuda && <span className="mt-0.5 block text-xs opacity-55">{accion.ayuda}</span>}
        </span>
        {accion.cargando && (
          <span className="mt-1 h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-current/20 border-t-current" />
        )}
      </button>
    );
  }

  return (
    <>
      <button
        ref={botonRef}
        onClick={() => (abierto ? cerrar() : abrir())}
        className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
          abierto
            ? 'bg-brand-900/[0.08] text-brand-900'
            : 'text-brand-900/45 hover:bg-brand-900/[0.06] hover:text-brand-900'
        }`}
        aria-label="Acciones"
        aria-haspopup="menu"
        aria-expanded={abierto}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="12" cy="19" r="1.8" />
        </svg>
      </button>

      {posicion &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              position: 'fixed',
              top: posicion.top,
              left: posicion.left,
              width: ANCHO_MENU,
              transform: posicion.haciaArriba ? 'translateY(-100%)' : undefined,
            }}
            className="z-[70] rounded-xl border border-brand-900/10 bg-white p-1.5 shadow-xl ring-1 ring-black/[0.02]"
          >
            {normales.map(renderAccion)}

            {peligrosas.length > 0 && (
              <>
                {normales.length > 0 && <div className="mx-2 my-1 border-t border-brand-900/8" />}
                {peligrosas.map(renderAccion)}
              </>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
