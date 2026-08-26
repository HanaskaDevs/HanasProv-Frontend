// src/modules/reportes/pages/ReporteCalificacionProveedoresPage.tsx
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/hooks/useAuth';
import RoleRoute from '../../../routes/RoleRoute';
import Card from '../../../shared/components/Card';
import Spinner from '../../../shared/components/Spinner';
import { DesgloseCalificacion } from '../../../shared/components/CalificacionGlobal';
import { colorTexto, formatearNota } from '../../../shared/utils/formatoCalificacion';
import * as calificacionGlobalApi from '../../../shared/api/calificacionGlobalApi';
import type { CalificacionGlobalEnLote } from '../../../shared/api/calificacionGlobalApi';
import GraficoRadar, { type SerieRadar } from '../components/GraficoRadar';
import SelectorProveedores from '../components/SelectorProveedores';

/**
 * Máximo de proveedores en el radar.
 *
 * Es 3 por una razón medida, no por criterio: en un radar todas las series se
 * superponen, así que hay que poder distinguir cualquier par de colores, no
 * solo los vecinos. Los tres primeros colores de la paleta pasan todas las
 * comprobaciones (peor par ΔE 9.2 en deuteranopía, 24.0 en visión normal); con
 * el cuarto, naranja y amarillo caen a ΔE 13.7 en visión NORMAL, por debajo
 * del piso de 15.
 */
const MAXIMO_EN_RADAR = 3;

/** Los tres primeros de la paleta categórica validada, en orden fijo. */
const COLORES_SERIE = ['#2a78d6', '#eb6834', '#1baf7a'];

/**
 * Reporte de Calificación de Proveedores.
 *
 * Dos modos:
 *  - UN PROVEEDOR: su desglose completo, en texto y números.
 *  - COMPARAR: radar con un eje por componente de la nota. El radar es la
 *    forma correcta acá porque lo que se compara son varios ejes a la vez del
 *    MISMO proveedor contra otro: la silueta muestra en qué es fuerte y en qué
 *    flojo, que es justo la pregunta. Para un solo indicador entre muchos
 *    proveedores, la forma correcta son barras (ver el reporte de Cumplimiento
 *    de entregas).
 */
function Contenido() {
  const [modo, setModo] = useState<'uno' | 'comparar'>('uno');
  const [seleccionados, setSeleccionados] = useState<number[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['calificaciones-globales'],
    queryFn: calificacionGlobalApi.obtenerCalificacionesGlobales,
  });

  const proveedores = useMemo(() => data ?? [], [data]);

  const elegidos = useMemo(
    () => proveedores.filter((p) => seleccionados.includes(p.id_proveedor)),
    [proveedores, seleccionados]
  );

  function cambiarModo(nuevo: 'uno' | 'comparar') {
    setModo(nuevo);
    // Al volver a "uno" se conserva solo el primero: si no, quedaban tres
    // elegidos y la pantalla mostraba uno sin explicar por qué.
    setSeleccionados((previo) => (nuevo === 'uno' ? previo.slice(0, 1) : previo));
  }

  // Los ejes son la UNIÓN de los componentes de los elegidos, ordenados por
  // peso: si a un proveedor le falta la auditoría, el eje sigue estando (con
  // su valor en el centro) en vez de desaparecer del gráfico.
  const ejes = useMemo(() => construirEjes(elegidos), [elegidos]);

  const series: SerieRadar[] = useMemo(
    () =>
      elegidos.map((p) => ({
        nombre: p.razon_social ?? 'Sin nombre',
        valores: ejes.map((eje) => {
          const componente = p.componentes.find((c) => c.clave === eje.clave);
          return componente ? componente.porcentaje : null;
        }),
      })),
    [elegidos, ejes]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-brand-900">
          Calificación de proveedores
        </h1>
        <p className="text-sm text-brand-900/60 mt-1">
          Mira el desglose de un proveedor, o compara hasta {MAXIMO_EN_RADAR} para ver en qué
          componentes se diferencian.
        </p>
      </div>

      <Card>
        <fieldset>
          <legend className="text-xs font-semibold uppercase tracking-wide text-brand-900/50 mb-2.5">
            Qué quieres ver
          </legend>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
            <OpcionRadio
              valor="uno"
              actual={modo}
              onCambiar={cambiarModo}
              etiqueta="Un proveedor"
              descripcion="Desglose completo de su nota"
            />
            <OpcionRadio
              valor="comparar"
              actual={modo}
              onCambiar={cambiarModo}
              etiqueta="Comparar proveedores"
              descripcion={`Radar por componente, hasta ${MAXIMO_EN_RADAR}`}
            />
          </div>
        </fieldset>
      </Card>

      <SelectorProveedores
        proveedores={proveedores}
        cargando={isLoading}
        seleccionados={seleccionados}
        onCambiar={(ids) => setSeleccionados(modo === 'uno' ? ids.slice(-1) : ids)}
        maximo={modo === 'uno' ? 1 : MAXIMO_EN_RADAR}
        titulo={modo === 'uno' ? 'Elige el proveedor' : 'Agrega proveedores a comparar'}
      />

      {isLoading ? (
        <Card>
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        </Card>
      ) : elegidos.length === 0 ? (
        <Card>
          <p className="text-center text-sm text-brand-900/50 py-8">
            {modo === 'uno'
              ? 'Elige un proveedor de la lista para ver su calificación.'
              : 'Agrega al menos dos proveedores para compararlos en el radar.'}
          </p>
        </Card>
      ) : modo === 'uno' ? (
        <Card>
          <DesgloseCalificacion datos={elegidos[0]} subtitulo={elegidos[0].razon_social ?? undefined} />
        </Card>
      ) : elegidos.length === 1 ? (
        <Card>
          <p className="text-center text-sm text-brand-900/50 py-8">
            Con un solo proveedor no hay nada que comparar. Agrega otro.
          </p>
        </Card>
      ) : (
        <>
          <Card>
            <p className="font-display text-base font-semibold text-brand-900 mb-1">
              Comparativa por componente
            </p>
            <p className="text-[12.5px] text-brand-900/55 mb-4">
              Cada eje es el porcentaje de cumplimiento de ese componente. Un eje en el centro
              significa que ese componente todavía no se pudo medir para ese proveedor.
            </p>
            <GraficoRadar
              ejes={ejes.map((e) => e.etiqueta)}
              series={series}
              colores={COLORES_SERIE}
            />
          </Card>

          {/* La tabla no es redundante con el radar: el radar muestra la
              FORMA (en qué se diferencian) y la tabla los números exactos.
              Además es la vista accesible del mismo dato, que es lo que hace
              que la identidad no dependa nunca del color. */}
          <TablaComparativa proveedores={elegidos} ejes={ejes} />
        </>
      )}
    </div>
  );
}

function construirEjes(elegidos: CalificacionGlobalEnLote[]) {
  const vistos = new Map<string, { clave: string; etiqueta: string; peso: number }>();

  elegidos.forEach((p) => {
    p.componentes.forEach((c) => {
      if (!vistos.has(c.clave)) vistos.set(c.clave, { clave: c.clave, etiqueta: c.etiqueta, peso: c.peso });
    });
    p.componentes_sin_datos.forEach((c) => {
      if (!vistos.has(c.clave))
        vistos.set(c.clave, { clave: c.clave, etiqueta: c.etiqueta, peso: c.peso_original });
    });
  });

  return [...vistos.values()].sort((a, b) => b.peso - a.peso);
}

function OpcionRadio({
  valor,
  actual,
  onCambiar,
  etiqueta,
  descripcion,
}: {
  valor: 'uno' | 'comparar';
  actual: 'uno' | 'comparar';
  onCambiar: (v: 'uno' | 'comparar') => void;
  etiqueta: string;
  descripcion: string;
}) {
  const elegido = actual === valor;

  return (
    <label
      className={`flex flex-1 items-start gap-2.5 rounded-lg border px-3.5 py-2.5 cursor-pointer transition-colors ${
        elegido ? 'border-brand-700 bg-brand-200/20' : 'border-brand-900/12 hover:bg-brand-900/[0.02]'
      }`}
    >
      <input
        type="radio"
        name="modo-reporte"
        checked={elegido}
        onChange={() => onCambiar(valor)}
        className="mt-0.5 h-4 w-4 shrink-0 text-brand-700 focus:ring-brand-700"
      />
      <span>
        <span className="block text-sm font-medium text-brand-900">{etiqueta}</span>
        <span className="block text-xs text-brand-900/55">{descripcion}</span>
      </span>
    </label>
  );
}

function TablaComparativa({
  proveedores,
  ejes,
}: {
  proveedores: CalificacionGlobalEnLote[];
  ejes: { clave: string; etiqueta: string; peso: number }[];
}) {
  return (
    <Card className="!p-0 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-brand-900/8">
        <p className="text-sm font-medium text-brand-900">Los mismos datos, en números</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[34rem]">
          <thead className="bg-brand-200/25 text-left">
            <tr>
              <th className="px-4 py-2.5 text-xs font-medium text-brand-900/70">Componente</th>
              {proveedores.map((p, i) => (
                <th key={p.id_proveedor} className="px-4 py-2.5 text-xs font-medium text-brand-900/70">
                  <span className="flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 shrink-0 rounded-sm"
                      style={{ backgroundColor: COLORES_SERIE[i % COLORES_SERIE.length] }}
                    />
                    <span className="truncate max-w-[10rem]">{p.razon_social ?? 'Sin nombre'}</span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-brand-900/8">
            <tr className="bg-brand-900/[0.03]">
              <td className="px-4 py-3 font-medium text-brand-900">Calificación global</td>
              {proveedores.map((p) => (
                <td key={p.id_proveedor} className="px-4 py-3">
                  {p.puntaje_total === null ? (
                    <span className="text-xs text-brand-900/40">Sin datos</span>
                  ) : (
                    <>
                      <span className={`font-display text-lg font-semibold tabular-nums ${colorTexto(p.puntaje_total)}`}>
                        {formatearNota(p.puntaje_total)}
                      </span>
                      <span className="text-[11px] text-brand-900/40">/100</span>
                      {p.peso_evaluado < 100 && (
                        <span className="block text-[10.5px] text-brand-900/40">
                          sobre {p.peso_evaluado} pts
                        </span>
                      )}
                    </>
                  )}
                </td>
              ))}
            </tr>

            {ejes.map((eje) => (
              <tr key={eje.clave} className="hover:bg-brand-900/[0.02]">
                <td className="px-4 py-2.5">
                  <span className="text-brand-900">{eje.etiqueta}</span>
                  <span className="block text-[11px] text-brand-900/40">vale {eje.peso} pts</span>
                </td>

                {proveedores.map((p) => {
                  const componente = p.componentes.find((c) => c.clave === eje.clave);

                  return (
                    <td key={p.id_proveedor} className="px-4 py-2.5">
                      {componente ? (
                        <>
                          <span className="font-medium tabular-nums text-brand-900">
                            {formatearNota(componente.puntaje)}
                            <span className="font-normal text-brand-900/40">/{componente.peso}</span>
                          </span>
                          <span className="block text-[11px] text-brand-900/45">
                            {componente.porcentaje}%
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-brand-900/35">No evaluado</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default function ReporteCalificacionProveedoresPage() {
  const { esSistemas, esAdmin, esCalidad } = useAuth();

  return (
    <RoleRoute allow={esSistemas || esAdmin || esCalidad}>
      <Contenido />
    </RoleRoute>
  );
}
