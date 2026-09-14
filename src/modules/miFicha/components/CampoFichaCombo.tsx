import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Una opción puede ser:
 * - un string: se muestra y se envía el mismo texto (caso "Ciudad").
 * - un objeto {valor, etiqueta}: se MUESTRA la etiqueta y se ENVÍA el
 *   valor. Hace falta para los catálogos que tienen que coincidir con
 *   Business Central: en "Clase de contribuyente" el proveedor lee
 *   "Persona Natural" pero lo que viaja es el código "PERSONA NATURAL".
 */
export type OpcionCombo = string | { valor: string; etiqueta: string };

function normalizar(opcion: OpcionCombo): { valor: string; etiqueta: string } {
  return typeof opcion === 'string' ? { valor: opcion, etiqueta: opcion } : opcion;
}

/** Sin tildes y en minúsculas, para que "rumiñahui" encuentre "Rumiñahui". */
function comparable(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

const ALTO_MAXIMO_PANEL = 260;
/** A partir de cuántas opciones aparece el buscador. */
const MINIMO_PARA_BUSCAR = 7;

function IconoChevron({ abierto }: { abierto: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 transition-transform duration-150 ${abierto ? 'rotate-180' : ''}`}
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function IconoLupa() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconoCheck() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/**
 * SELECTOR DE LA FICHA, en reemplazo del <select> nativo.
 *
 * POR QUÉ NO EL NATIVO (pedido del usuario, 12-sep-2026: "no quiero que
 * se vea ese listado tan largo hacia abajo pero sí que se vea mejor"):
 * "Ciudad" tiene 37 opciones, y el desplegable del navegador las dibuja
 * TODAS de corrido, tapando media pantalla y obligando a recorrerlas a
 * ojo. Acá el panel tiene alto fijo con scroll y, en cuanto la lista
 * pasa de MINIMO_PARA_BUSCAR opciones, un buscador arriba: escribir
 * "rumi" deja una sola fila.
 *
 * EL PANEL VA EN UN PORTAL Y POSICIONADO FIJO, no como hijo del campo.
 * La ficha se muestra dentro de un modal cuyo contenido tiene
 * overflow-y-auto: un panel absolute quedaría recortado por ese borde
 * justo en los campos de más abajo, que son los que más lo necesitan.
 * Al vivir en el <body> no lo recorta nadie, y si no entra hacia abajo
 * se abre hacia arriba.
 *
 * La búsqueda ignora tildes y mayúsculas -> nadie debería tener que
 * escribir "Rumiñahui" con la ñ correcta para encontrar su cantón.
 */
export default function CampoFichaCombo({
  label,
  opciones,
  value,
  onChange,
  placeholder = 'Selecciona...',
  error,
  resaltado = false,
  accesorio,
  disabled = false,
  id,
}: {
  label: string;
  opciones: readonly OpcionCombo[];
  value: string;
  onChange: (valor: string) => void;
  placeholder?: string;
  error?: string;
  resaltado?: boolean;
  accesorio?: ReactNode;
  disabled?: boolean;
  id?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [resaltada, setResaltada] = useState(0);
  const [posicion, setPosicion] = useState<{ top: number; left: number; width: number; haciaArriba: boolean } | null>(null);

  const disparadorRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const buscadorRef = useRef<HTMLInputElement>(null);

  const normalizadas = useMemo(() => opciones.map(normalizar), [opciones]);
  const seleccionada = normalizadas.find((o) => o.valor === value);
  const muestraBuscador = normalizadas.length >= MINIMO_PARA_BUSCAR;

  const filtradas = useMemo(() => {
    const texto = comparable(busqueda.trim());
    if (!texto) return normalizadas;
    return normalizadas.filter((o) => comparable(o.etiqueta).includes(texto));
  }, [normalizadas, busqueda]);

  /**
   * Se mide en el momento de abrir (y no en un efecto posterior) para
   * que el panel aparezca ya en su sitio, sin un primer cuadro dibujado
   * en la esquina de la pantalla.
   */
  function calcularPosicion() {
    const caja = disparadorRef.current?.getBoundingClientRect();
    if (!caja) return;

    const espacioAbajo = window.innerHeight - caja.bottom;
    const haciaArriba = espacioAbajo < ALTO_MAXIMO_PANEL && caja.top > espacioAbajo;

    setPosicion({
      top: haciaArriba ? caja.top - 4 : caja.bottom + 4,
      left: caja.left,
      // Mínimo el ancho del campo, pero sin achicarse tanto que las
      // etiquetas largas ("Nueva Loja (Lago Agrio)") queden cortadas.
      width: Math.max(caja.width, 230),
      haciaArriba,
    });
  }

  function abrir() {
    if (disabled) return;
    calcularPosicion();
    setBusqueda('');
    setResaltada(Math.max(0, normalizadas.findIndex((o) => o.valor === value)));
    setAbierto(true);
  }

  function cerrar() {
    setAbierto(false);
    disparadorRef.current?.focus();
  }

  function elegir(valor: string) {
    onChange(valor);
    setAbierto(false);
    disparadorRef.current?.focus();
  }

  // Cerrar al hacer clic fuera, y reposicionar si la página se desplaza
  // o cambia de tamaño con el panel abierto (la ficha vive dentro de un
  // modal que scrollea: sin esto, el panel se quedaría flotando donde
  // estaba el campo).
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
    // true = fase de captura: así también se entera de los scrolls de
    // contenedores internos, no solo del de la ventana.
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

    // scrollIntoView acá y no en un efecto: es una consecuencia directa
    // de esta tecla, no del render.
    panelRef.current
      ?.querySelector(`[data-indice="${siguiente}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }

  function alTeclearEnPanel(evento: React.KeyboardEvent) {
    if (evento.key === 'ArrowDown') {
      evento.preventDefault();
      moverResaltada(1);
    } else if (evento.key === 'ArrowUp') {
      evento.preventDefault();
      moverResaltada(-1);
    } else if (evento.key === 'Enter') {
      evento.preventDefault();
      const elegida = filtradas[resaltada];
      if (elegida) elegir(elegida.valor);
    } else if (evento.key === 'Escape') {
      evento.preventDefault();
      cerrar();
    } else if (evento.key === 'Tab') {
      setAbierto(false);
    }
  }

  const idCampo = id ?? label.replace(/\s+/g, '-').toLowerCase();

  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <div className="flex items-center gap-1.5">
        {/* Mismo bloque de label + puntitos que CampoFicha, para que las
            dos columnas de la ficha sigan alineadas. */}
        <div className="flex w-[168px] shrink-0 items-center gap-1">
          <label htmlFor={idCampo} className="shrink-0 whitespace-nowrap text-[12.5px] text-brand-900/60">
            {label}
          </label>
          <span aria-hidden="true" className="h-0 min-w-1 flex-1 border-b border-dotted border-brand-900/35" />
        </div>

        <button
          ref={disparadorRef}
          id={idCampo}
          type="button"
          role="combobox"
          aria-expanded={abierto}
          aria-haspopup="listbox"
          aria-controls={abierto ? `${idCampo}-lista` : undefined}
          disabled={disabled}
          onClick={() => (abierto ? setAbierto(false) : abrir())}
          onKeyDown={(e) => {
            if (!abierto && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              abrir();
            }
          }}
          className={`flex min-w-0 max-w-[220px] w-full items-center justify-between gap-1.5 rounded-sm border bg-white px-2 py-1
            text-left text-[13px] text-brand-900 shadow-sm
            focus:outline-none focus:ring-1 focus:ring-brand-700 focus:border-brand-700
            disabled:cursor-default disabled:bg-brand-900/[0.04] disabled:text-brand-900/70
            disabled:shadow-none disabled:border-brand-900/10
            ${resaltado ? 'border-brand-700 ring-1 ring-brand-200 bg-brand-200/25' : error ? 'border-brand-wine' : 'border-brand-900/20'}`}
        >
          <span className={`truncate ${seleccionada ? '' : 'text-brand-900/30'}`}>
            {seleccionada?.etiqueta ?? placeholder}
          </span>
          <IconoChevron abierto={abierto} />
        </button>
        {accesorio}
      </div>

      {error && <span className="pl-0.5 text-[12px] text-brand-wine">{error}</span>}

      {abierto &&
        posicion &&
        createPortal(
          <div
            ref={panelRef}
            onKeyDown={alTeclearEnPanel}
            style={{
              position: 'fixed',
              top: posicion.haciaArriba ? undefined : posicion.top,
              bottom: posicion.haciaArriba ? window.innerHeight - posicion.top : undefined,
              left: posicion.left,
              width: posicion.width,
              maxHeight: ALTO_MAXIMO_PANEL,
            }}
            // z-[80]: por encima del modal de la ficha (z-[60]) y del
            // visor de PDF (z-[70]).
            className="z-[80] flex flex-col overflow-hidden rounded-md border border-brand-900/15 bg-white shadow-xl"
          >
            {muestraBuscador && (
              <div className="flex items-center gap-1.5 border-b border-brand-900/8 px-2 py-1.5 text-brand-900/35">
                <IconoLupa />
                <input
                  ref={buscadorRef}
                  autoFocus
                  value={busqueda}
                  onChange={(e) => {
                    setBusqueda(e.target.value);
                    setResaltada(0);
                  }}
                  placeholder="Escribe para filtrar..."
                  className="w-full bg-transparent text-[13px] text-brand-900 placeholder:text-brand-900/30 focus:outline-none"
                />
              </div>
            )}

            <ul id={`${idCampo}-lista`} role="listbox" className="overflow-y-auto py-1">
              {filtradas.length === 0 ? (
                <li className="px-2.5 py-3 text-center text-[12.5px] text-brand-900/40">Sin resultados</li>
              ) : (
                filtradas.map((opcion, indice) => {
                  const elegida = opcion.valor === value;

                  return (
                    <li key={opcion.valor} role="option" aria-selected={elegida} data-indice={indice}>
                      <button
                        type="button"
                        // onMouseEnter y no hover de CSS: así el resaltado
                        // del mouse y el de las flechas son el mismo, y no
                        // quedan dos filas "activas" a la vez.
                        onMouseEnter={() => setResaltada(indice)}
                        onClick={() => elegir(opcion.valor)}
                        className={`flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left text-[13px] transition-colors
                          ${indice === resaltada ? 'bg-brand-200/60 text-brand-900' : 'text-brand-900/80'}
                          ${elegida ? 'font-semibold' : ''}`}
                      >
                        <span className="truncate">{opcion.etiqueta}</span>
                        {elegida && <span className="shrink-0 text-brand-700"><IconoCheck /></span>}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>

            {muestraBuscador && filtradas.length > 0 && (
              <p className="border-t border-brand-900/8 px-2.5 py-1 text-[11px] text-brand-900/35">
                {filtradas.length} de {normalizadas.length}
              </p>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
