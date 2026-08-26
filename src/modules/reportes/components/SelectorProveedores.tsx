// src/modules/reportes/components/SelectorProveedores.tsx
import { useMemo, useState } from 'react';
import Card from '../../../shared/components/Card';
import Spinner from '../../../shared/components/Spinner';
import BarraBusqueda from '../../../shared/components/BarraBusqueda';
import Avatar from '../../../shared/components/Avatar';
import { colorTexto, formatearNota } from '../../../shared/utils/formatoCalificacion';
import type { CalificacionGlobalEnLote } from '../../../shared/api/calificacionGlobalApi';

/**
 * Selector de proveedores para los reportes. Lo comparten las dos pantallas
 * de reporte, así que el comportamiento (buscar, elegir, limpiar, tope) es
 * igual en las dos y no hay que mantenerlo dos veces.
 *
 * `maximo` existe por una razón concreta y no por gusto: en el radar todas
 * las series se superponen, y la paleta validada solo garantiza que tres
 * colores se distingan entre sí (el cuarto cae por debajo del piso de visión
 * normal). Cuando se alcanza el tope, las filas no elegidas se deshabilitan y
 * se dice por qué, en vez de dejar hacer clic y descartar la selección en
 * silencio.
 */
export default function SelectorProveedores({
  proveedores,
  cargando,
  seleccionados,
  onCambiar,
  maximo,
  titulo,
}: {
  proveedores: CalificacionGlobalEnLote[];
  cargando: boolean;
  seleccionados: number[];
  onCambiar: (ids: number[]) => void;
  /** Tope de selección. Sin tope si se omite. */
  maximo?: number;
  titulo: string;
}) {
  const [busqueda, setBusqueda] = useState('');

  const filtrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return proveedores;
    return proveedores.filter((p) =>
      [p.razon_social, p.nombre_comercial, p.ruc]
        .filter(Boolean)
        .some((campo) => campo!.toLowerCase().includes(termino))
    );
  }, [proveedores, busqueda]);

  const topeAlcanzado = maximo !== undefined && seleccionados.length >= maximo;

  function alternar(id: number) {
    if (seleccionados.includes(id)) {
      onCambiar(seleccionados.filter((x) => x !== id));
      return;
    }
    if (topeAlcanzado) return;
    onCambiar([...seleccionados, id]);
  }

  return (
    <Card className="!p-0 overflow-hidden">
      <div className="px-5 pt-4 pb-3 border-b border-brand-900/8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-brand-900">
            {titulo}
            {seleccionados.length > 0 && (
              <span className="ml-2 text-xs font-normal text-brand-900/50">
                {seleccionados.length}
                {maximo !== undefined && ` de ${maximo}`} elegido
                {seleccionados.length === 1 ? '' : 's'}
              </span>
            )}
          </p>
          {seleccionados.length > 0 && (
            <button
              type="button"
              onClick={() => onCambiar([])}
              className="text-xs text-brand-700 underline hover:no-underline"
            >
              Limpiar selección
            </button>
          )}
        </div>

        {topeAlcanzado && (
          <p className="mt-2 text-[12px] text-amber-700">
            Llegaste al máximo de {maximo}. Con más proveedores superpuestos los colores dejan de
            distinguirse, incluso sin daltonismo. Quita uno para cambiarlo.
          </p>
        )}

        <div className="mt-3">
          <BarraBusqueda
            valor={busqueda}
            onCambiar={setBusqueda}
            placeholder="Buscar por razón social, nombre comercial o RUC…"
          />
        </div>
      </div>

      {cargando ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : filtrados.length === 0 ? (
        <p className="text-center text-sm text-brand-900/50 py-12">
          No hay proveedores que coincidan con la búsqueda.
        </p>
      ) : (
        <ul className="divide-y divide-brand-900/8 max-h-64 overflow-y-auto">
          {filtrados.map((p) => {
            const elegido = seleccionados.includes(p.id_proveedor);
            const bloqueado = !elegido && topeAlcanzado;

            return (
              <li key={p.id_proveedor}>
                <label
                  className={`flex items-center gap-3 px-5 py-2.5 transition-colors ${
                    bloqueado
                      ? 'opacity-40 cursor-not-allowed'
                      : elegido
                        ? 'bg-brand-200/20 cursor-pointer'
                        : 'hover:bg-brand-900/[0.02] cursor-pointer'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={elegido}
                    disabled={bloqueado}
                    onChange={() => alternar(p.id_proveedor)}
                    className="h-4 w-4 shrink-0 text-brand-700 focus:ring-brand-700 disabled:cursor-not-allowed"
                  />
                  <Avatar nombre={p.razon_social ?? '?'} className="h-7 w-7" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-brand-900">
                      {p.razon_social ?? 'Sin razón social'}
                    </span>
                    <span className="block text-[11.5px] text-brand-900/45">{p.ruc ?? 'Sin RUC'}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    {p.puntaje_total === null ? (
                      <span className="text-xs text-brand-900/35">Sin datos</span>
                    ) : (
                      <span
                        className={`font-display text-sm font-semibold tabular-nums ${colorTexto(p.puntaje_total)}`}
                      >
                        {formatearNota(p.puntaje_total)}
                        <span className="text-[11px] font-normal text-brand-900/35">/100</span>
                      </span>
                    )}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
