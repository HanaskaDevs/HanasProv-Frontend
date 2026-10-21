import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface OpcionBuscable {
  valor: number | string;
  /** Lo que se lee: el nombre. */
  etiqueta: string;
  /** Código que va adelante, en una etiqueta aparte (ej. el código BC). */
  codigo?: string | null;
  /** Textos que también encuentran la opción sin mostrarse (ej. el RUC). */
  buscarTambien?: (string | null | undefined)[];
}

/** Sin tildes y en minúsculas: "alimec" encuentra "ALIMEC" y "peña" encuentra "PENA". */
function comparable(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

const ALTO_MAXIMO_PANEL = 320;

/**
 * Selector con buscador, para listas largas (21-oct-2026). Lo estrena el
 * proveedor del calendario de horarios: con 150 proveedores, el <select>
 * nativo obligaba a bajar toda la lista buscando a ojo.
 *
 * Busca por nombre, por código y por lo que venga en `buscarTambien`, sin
 * importar tildes ni mayúsculas. Se maneja con el teclado (flechas, Enter,
 * Escape).
 *
 * El panel va en un PORTAL con posición fija, igual que CampoFichaCombo: el
 * selector vive dentro de modales con scroll, y un panel absolute quedaría
 * recortado por el borde del modal.
 */
export default function SelectorBuscable({
  id,
  opciones,
  valor,
  onChange,
  placeholder = 'Selecciona...',
  placeholderBusqueda = 'Buscar...',
  error = false,
}: {
  id?: string;
  opciones: OpcionBuscable[];
  valor: number | string | '';
  onChange: (valor: number | string) => void;
  placeholder?: string;
  placeholderBusqueda?: string;
  error?: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [resaltada, setResaltada] = useState(0);
  const [posicion, setPosicion] = useState<{ top: number; left: number; width: number; haciaArriba: boolean } | null>(null);

  const disparadorRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const seleccionada = opciones.find((o) => o.valor === valor);

  const filtradas = useMemo(() => {
    const texto = comparable(busqueda.trim());
    if (!texto) return opciones;
    return opciones.filter((o) =>
      [o.etiqueta, o.codigo, ...(o.buscarTambien ?? [])].some((t) => t && comparable(t).includes(texto))
    );
  }, [opciones, busqueda]);

  function calcularPosicion() {
    const caja = disparadorRef.current?.getBoundingClientRect();
    if (!caja) return;

    const espacioAbajo = window.innerHeight - caja.bottom;
    const haciaArriba = espacioAbajo < ALTO_MAXIMO_PANEL && caja.top > espacioAbajo;

    setPosicion({
      top: haciaArriba ? caja.top - 4 : caja.bottom + 4,
      left: caja.left,
      width: Math.max(caja.width, 320),
      haciaArriba,
    });
  }

  function abrir() {
    calcularPosicion();
    setBusqueda('');
    setResaltada(Math.max(0, opciones.findIndex((o) => o.valor === valor)));
    setAbierto(true);
  }

  function cerrar() {
    setAbierto(false);
    disparadorRef.current?.focus();
  }

  function elegir(opcion: OpcionBuscable) {
    onChange(opcion.valor);
    cerrar();
  }

  useEffect(() => {
    if (!abierto) return;

    function alClicar(evento: MouseEvent) {
      const destino = evento.target as Node;
      if (panelRef.current?.contains(destino) || disparadorRef.current?.contains(destino)) return;
      setAbierto(false);
    }

    function alMover() {
      calcularPosicion();
    }

    document.addEventListener('mousedown', alClicar);
    window.addEventListener('scroll', alMover, true);
    window.addEventListener('resize', alMover);

    return () => {
      document.removeEventListener('mousedown', alClicar);
      window.removeEventListener('scroll', alMover, true);
      window.removeEventListener('resize', alMover);
    };
  }, [abierto]);

  function moverResaltada(delta: number) {
    if (filtradas.length === 0) return;
    const siguiente = (resaltada + delta + filtradas.length) % filtradas.length;
    setResaltada(siguiente);
    panelRef.current?.querySelector(`[data-indice="${siguiente}"]`)?.scrollIntoView({ block: 'nearest' });
  }

  function alTeclear(evento: React.KeyboardEvent) {
    if (evento.key === 'ArrowDown') {
      evento.preventDefault();
      moverResaltada(1);
    } else if (evento.key === 'ArrowUp') {
      evento.preventDefault();
      moverResaltada(-1);
    } else if (evento.key === 'Enter') {
      evento.preventDefault();
      const elegida = filtradas[resaltada];
      if (elegida) elegir(elegida);
    } else if (evento.key === 'Escape') {
      evento.preventDefault();
      // Que el Escape cierre el panel y no también el modal de atrás.
      evento.stopPropagation();
      cerrar();
    } else if (evento.key === 'Tab') {
      setAbierto(false);
    }
  }

  const idLista = `${id ?? 'selector'}-lista`;

  return (
    <>
      <button
        ref={disparadorRef}
        id={id}
        type="button"
        role="combobox"
        aria-expanded={abierto}
        aria-haspopup="listbox"
        aria-controls={abierto ? idLista : undefined}
        onClick={() => (abierto ? setAbierto(false) : abrir())}
        onKeyDown={(e) => {
          if (!abierto && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            abrir();
          }
        }}
        className={`flex h-10 w-full min-w-0 items-center gap-2 rounded-md border bg-white px-3 text-left text-sm text-brand-900
          focus:outline-none focus:ring-2 focus:ring-brand-700 ${error ? 'border-brand-wine' : 'border-brand-900/15'}`}
      >
        {seleccionada ? (
          <>
            {seleccionada.codigo && (
              <span className="shrink-0 rounded bg-brand-200/60 px-1.5 py-0.5 font-mono text-[11px] text-brand-900/70">
                {seleccionada.codigo}
              </span>
            )}
            <span className="min-w-0 flex-1 truncate">{seleccionada.etiqueta}</span>
          </>
        ) : (
          <span className="min-w-0 flex-1 truncate text-brand-900/40">{placeholder}</span>
        )}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`shrink-0 text-brand-900/50 transition-transform ${abierto ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {abierto &&
        posicion &&
        createPortal(
          <div
            ref={panelRef}
            onKeyDown={alTeclear}
            style={{
              position: 'fixed',
              top: posicion.haciaArriba ? undefined : posicion.top,
              bottom: posicion.haciaArriba ? window.innerHeight - posicion.top : undefined,
              left: posicion.left,
              width: posicion.width,
              maxHeight: ALTO_MAXIMO_PANEL,
            }}
            // z-[80]: por encima de los modales del portal.
            className="z-[80] flex flex-col overflow-hidden rounded-md border border-brand-900/15 bg-white shadow-xl"
          >
            <div className="flex items-center gap-2 border-b border-brand-900/8 px-3 py-2 text-brand-900/40">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                autoFocus
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setResaltada(0);
                }}
                placeholder={placeholderBusqueda}
                aria-controls={idLista}
                className="w-full bg-transparent text-sm text-brand-900 placeholder:text-brand-900/35 focus:outline-none"
              />
            </div>

            <ul id={idLista} role="listbox" className="overflow-y-auto py-1">
              {filtradas.length === 0 ? (
                <li className="px-3 py-4 text-center text-sm text-brand-900/45">Sin resultados</li>
              ) : (
                filtradas.map((opcion, indice) => {
                  const elegida = opcion.valor === valor;

                  return (
                    <li key={opcion.valor} role="option" aria-selected={elegida} data-indice={indice}>
                      <button
                        type="button"
                        onMouseEnter={() => setResaltada(indice)}
                        onClick={() => elegir(opcion)}
                        className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors
                          ${indice === resaltada ? 'bg-brand-200/50' : ''} ${elegida ? 'font-semibold' : ''}`}
                      >
                        {/* Ancho fijo: los nombres arrancan todos en la misma columna. */}
                        <span className="w-[104px] shrink-0 font-mono text-[11.5px] text-brand-900/55">
                          {opcion.codigo ?? <span className="font-sans italic text-brand-900/30">Sin código</span>}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-brand-900">{opcion.etiqueta}</span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>

            <p className="border-t border-brand-900/8 px-3 py-1.5 text-[11px] text-brand-900/40">
              {filtradas.length} de {opciones.length}
            </p>
          </div>,
          document.body
        )}
    </>
  );
}
