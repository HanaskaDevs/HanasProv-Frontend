// src/shared/components/CalificacionGlobal.tsx
import { useState } from 'react';
import Modal from './Modal';
import {
  colorAnillo,
  colorBarra,
  colorTexto,
  formatearNota,
} from '../utils/formatoCalificacion';

export interface ComponenteCalificacion {
  clave: string;
  etiqueta: string;
  /** Cuánto vale esta sección en el esquema original de 100 puntos. */
  peso: number;
  /** Cumplimiento de la sección, de 0 a 100. */
  porcentaje: number;
  /** Puntos obtenidos sobre `peso`. */
  puntaje: number;
  detalle: string;
}

export interface ComponenteSinDatos {
  clave: string;
  etiqueta: string;
  peso_original: number;
  motivo: string;
}

export interface CalificacionGlobalData {
  /** null si no hubo nada que medir. */
  puntaje_total: number | null;
  /** false = no hay con qué calificar todavía. */
  evaluable: boolean;
  /** Puntos obtenidos sobre `peso_evaluado`. */
  puntaje_obtenido?: number;
  /** Cuánto del esquema de 100 puntos se pudo medir. */
  peso_evaluado: number;
  componentes: ComponenteCalificacion[];
  /** Secciones que quedaron fuera del cálculo por falta de datos. */
  componentes_sin_datos: ComponenteSinDatos[];
}

/**
 * Nota global de desempeño del proveedor, sobre 100.
 *
 * ABRE UN MODAL, no un desplegable. Antes el desglose se expandía dentro de
 * la tarjeta, y como la tarjeta vive en una columna angosta a la derecha, el
 * detalle quedaba comprimido en esa columna y dejaba media pantalla vacía a
 * la izquierda. En un modal el desglose usa el ancho que necesita.
 *
 * Lo usan dos pantallas con el mismo componente: el proveedor en su
 * Calificación y el personal interno en la ficha del proveedor. Cambia solo
 * el texto del encabezado.
 */
export default function CalificacionGlobal({
  datos,
  titulo = 'Calificación global',
  subtitulo,
}: {
  datos: CalificacionGlobalData;
  titulo?: string;
  /** Ej. el nombre del proveedor, cuando lo mira alguien de la empresa. */
  subtitulo?: string;
}) {
  const [abierto, setAbierto] = useState(false);

  const nota = datos.puntaje_total;

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="w-full flex items-center gap-4 rounded-lg border border-brand-900/8 bg-white p-4 text-left shadow-sm
          hover:border-brand-900/20 hover:shadow transition-all
          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
      >
        <AnilloNota nota={nota} />

        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-900/50">{titulo}</p>
          {nota === null ? (
            <p className="font-display text-lg font-semibold leading-tight text-brand-900/50">
              Sin datos aún
            </p>
          ) : (
            <p className={`font-display text-2xl font-semibold leading-tight ${colorTexto(nota)}`}>
              {formatearNota(nota)}
              <span className="text-sm font-normal text-brand-900/40"> / 100</span>
            </p>
          )}
          <p className="mt-0.5 text-xs text-brand-700">Ver desglose</p>
        </div>

        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="shrink-0 text-brand-900/30"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </button>

      {abierto && (
        <Modal onClose={() => setAbierto(false)} title={titulo} maxWidth="max-w-2xl">
          <DesgloseCalificacion datos={datos} subtitulo={subtitulo} />
        </Modal>
      )}
    </>
  );
}

/**
 * El desglose completo. Se exporta aparte porque el reporte comparativo lo
 * reusa tal cual, sin el botón ni el modal.
 */
export function DesgloseCalificacion({
  datos,
  subtitulo,
  compacto = false,
}: {
  datos: CalificacionGlobalData;
  subtitulo?: string;
  /**
   * Versión apretada, para cuando el desglose es un bloque dentro de una
   * pantalla que ya tiene mucho contenido (la ficha del proveedor, por
   * ejemplo). Quita el anillo grande, las barras y el pie explicativo: deja
   * la nota y una línea por componente.
   */
  compacto?: boolean;
}) {
  const nota = datos.puntaje_total;

  return (
    <div className={compacto ? 'space-y-2.5' : 'space-y-5'}>
      {subtitulo && (
        <p className="font-display text-lg font-semibold text-brand-900 -mt-1">{subtitulo}</p>
      )}

      {nota === null ? (
        <div className={`rounded-lg bg-brand-900/[0.03] text-center ${compacto ? 'px-3 py-3' : 'px-4 py-5'}`}>
          <p className="text-sm text-brand-900/70">
            Todavía no hay nada que medir para este proveedor.
          </p>
        </div>
      ) : compacto ? (
        <div className="flex items-baseline gap-2">
          <span className={`font-display text-2xl font-semibold leading-none ${colorTexto(nota)}`}>
            {formatearNota(nota)}
          </span>
          <span className="text-sm text-brand-900/40">/ 100</span>
          {datos.peso_evaluado < 100 && (
            <span className="text-[11.5px] text-brand-900/45">
              · evaluado sobre {datos.peso_evaluado} pts
            </span>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-4 rounded-lg bg-brand-200/15 px-4 py-3.5">
          <AnilloNota nota={nota} grande />
          <div>
            <p className={`font-display text-3xl font-semibold leading-none ${colorTexto(nota)}`}>
              {formatearNota(nota)}
              <span className="text-base font-normal text-brand-900/40"> / 100</span>
            </p>
            {datos.puntaje_obtenido !== undefined && (
              <p className="mt-1.5 text-[13px] text-brand-900/60">
                {formatearNota(datos.puntaje_obtenido)} puntos obtenidos sobre{' '}
                {datos.peso_evaluado} evaluados
              </p>
            )}
          </div>
        </div>
      )}

      {datos.componentes.length > 0 && (
        compacto ? (
          <ul className="space-y-1">
            {datos.componentes.map((componente) => (
              <li key={componente.clave} className="flex items-baseline justify-between gap-3 text-[13px]">
                <span className="min-w-0 truncate text-brand-900/75">{componente.etiqueta}</span>
                <span className="shrink-0 font-medium tabular-nums text-brand-900">
                  {formatearNota(componente.puntaje)}
                  <span className="font-normal text-brand-900/40">/{componente.peso}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="divide-y divide-brand-900/8 rounded-lg border border-brand-900/8">
            {datos.componentes.map((componente) => (
              <FilaComponente key={componente.clave} componente={componente} />
            ))}
          </div>
        )
      )}

      {/* Lo no evaluado va como nota al pie, sin puntaje: no es que le haya
          ido mal, es que no hay con qué medirlo. Ponerlo como una fila más
          con "15/15" hacía que en un reporte pareciera un puntaje real. */}
      {datos.componentes_sin_datos.length > 0 && compacto && (
        <p className="text-[11.5px] leading-relaxed text-brand-900/45">
          No entra en la nota todavía:{' '}
          {datos.componentes_sin_datos.map((c) => c.etiqueta).join(', ')}.
        </p>
      )}

      {datos.componentes_sin_datos.length > 0 && !compacto && (
        <div className="rounded-lg bg-brand-900/[0.03] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-900/45">
            No entra en la nota todavía
          </p>
          <ul className="mt-2 space-y-1.5">
            {datos.componentes_sin_datos.map((componente) => (
              <li key={componente.clave} className="text-[13px] text-brand-900/60">
                <span className="font-medium text-brand-900/80">{componente.etiqueta}</span>
                {' — '}
                {componente.motivo}
              </li>
            ))}
          </ul>
          <p className="mt-2.5 text-[12px] text-brand-900/45">
            Estas secciones no suman ni restan: la nota se calcula solo sobre lo que sí se pudo
            medir.
          </p>
        </div>
      )}
    </div>
  );
}

function FilaComponente({ componente }: { componente: ComponenteCalificacion }) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium text-brand-900">
          {componente.etiqueta}
          <span className="ml-1.5 text-xs font-normal text-brand-900/40">
            vale {componente.peso} pts
          </span>
        </p>
        <p className="shrink-0 text-sm font-semibold tabular-nums text-brand-900">
          {formatearNota(componente.puntaje)}
          <span className="font-normal text-brand-900/40">/{componente.peso}</span>
        </p>
      </div>

      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-brand-900/8">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorBarra(componente.porcentaje)}`}
          style={{ width: `${Math.min(100, Math.max(0, componente.porcentaje))}%` }}
        />
      </div>

      <p className="mt-1.5 text-xs text-brand-900/55">{componente.detalle}</p>
    </div>
  );
}

function AnilloNota({ nota, grande = false }: { nota: number | null; grande?: boolean }) {
  const lado = grande ? 64 : 54;
  const radio = grande ? 26 : 22;
  const grosor = grande ? 6 : 5;
  const centro = lado / 2;
  const circunferencia = 2 * Math.PI * radio;
  const valor = nota ?? 0;
  const offset = circunferencia * (1 - Math.min(100, Math.max(0, valor)) / 100);

  return (
    <svg
      width={lado}
      height={lado}
      viewBox={`0 0 ${lado} ${lado}`}
      className="shrink-0 -rotate-90"
      aria-hidden="true"
    >
      <circle cx={centro} cy={centro} r={radio} fill="none" strokeWidth={grosor} className="stroke-brand-900/8" />
      {nota !== null && (
        <circle
          cx={centro}
          cy={centro}
          r={radio}
          fill="none"
          strokeWidth={grosor}
          strokeLinecap="round"
          strokeDasharray={circunferencia}
          strokeDashoffset={offset}
          className={`transition-all duration-700 ${colorAnillo(nota)}`}
        />
      )}
    </svg>
  );
}
