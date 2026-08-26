// src/modules/reportes/pages/ReporteCumplimientoEntregasPage.tsx
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/hooks/useAuth';
import RoleRoute from '../../../routes/RoleRoute';
import Card from '../../../shared/components/Card';
import Spinner from '../../../shared/components/Spinner';
import * as calificacionGlobalApi from '../../../shared/api/calificacionGlobalApi';
import GraficoBarras, { type BarraDato } from '../components/GraficoBarras';

/** Meta de fill rate contra la que se compara. */
const META_FILL_RATE = 95;

/**
 * Reporte de Cumplimiento de Entregas: el fill rate de todos los proveedores,
 * en barras y ordenado.
 *
 * POR QUÉ BARRAS Y NO RADAR: acá se compara UN indicador entre MUCHOS
 * proveedores. Un radar sirve para lo contrario (varios ejes de pocos
 * proveedores). Con un solo indicador, la longitud de una barra es la
 * codificación más precisa que existe para comparar magnitudes, y no tiene
 * tope de series: entran todos los proveedores que haya.
 *
 * Va ordenado de mayor a menor, no alfabético: la pregunta es "quién cumple y
 * quién no", y ordenado se responde con mirar los extremos.
 *
 * Los proveedores SIN pedidos cerrados no se grafican: no tienen fill rate
 * (no es 0, es que no hay nada que medir). Se listan aparte para que no
 * parezca que se perdieron del reporte.
 */
function Contenido() {
  const { data, isLoading } = useQuery({
    queryKey: ['calificaciones-globales'],
    queryFn: calificacionGlobalApi.obtenerCalificacionesGlobales,
  });

  const { conDatos, sinDatos, promedio } = useMemo(() => {
    const proveedores = data ?? [];

    const conDatos: BarraDato[] = [];
    const sinDatos: string[] = [];

    proveedores.forEach((p) => {
      const fillRate = p.componentes.find((c) => c.clave === 'fill_rate');
      const nombre = p.razon_social ?? 'Sin razón social';

      if (!fillRate) {
        sinDatos.push(nombre);
        return;
      }

      conDatos.push({
        etiqueta: nombre,
        valor: fillRate.porcentaje,
        detalle: fillRate.detalle.replace('Promedio de ', '').replace(' cerrado(s)', ' cerrados'),
      });
    });

    conDatos.sort((a, b) => b.valor - a.valor);

    const promedio =
      conDatos.length > 0
        ? conDatos.reduce((suma, d) => suma + d.valor, 0) / conDatos.length
        : null;

    return { conDatos, sinDatos, promedio };
  }, [data]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-brand-900">
          Cumplimiento de entregas
        </h1>
        <p className="text-sm text-brand-900/60 mt-1">
          Fill rate de cada proveedor: el promedio de lo entregado en sus pedidos ya cerrados.
        </p>
      </div>

      {isLoading ? (
        <Card>
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        </Card>
      ) : (
        <>
          {promedio !== null && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Indicador
                valor={`${promedio.toFixed(1)}%`}
                etiqueta="Fill rate promedio"
                detalle={`${conDatos.length} proveedor${conDatos.length === 1 ? '' : 'es'} con pedidos cerrados`}
              />
              <Indicador
                valor={String(conDatos.filter((d) => d.valor >= META_FILL_RATE).length)}
                etiqueta={`En meta (${META_FILL_RATE}% o más)`}
                detalle="Cumplen lo esperado"
              />
              <Indicador
                valor={String(conDatos.filter((d) => d.valor < 75).length)}
                etiqueta="Por debajo del 75%"
                detalle="Necesitan seguimiento"
                alerta
              />
            </div>
          )}

          <Card>
            <p className="font-display text-base font-semibold text-brand-900 mb-1">
              Fill rate por proveedor
            </p>
            <p className="text-[12.5px] text-brand-900/55 mb-5">
              Ordenado de mayor a menor. La línea punteada es la meta del {META_FILL_RATE}%.
            </p>

            <GraficoBarras
              datos={conDatos}
              referencia={META_FILL_RATE}
              etiquetaReferencia={`Meta: ${META_FILL_RATE}% de cumplimiento`}
            />
          </Card>

          {sinDatos.length > 0 && (
            <Card>
              <p className="text-sm font-medium text-brand-900">Sin pedidos cerrados todavía</p>
              <p className="mt-1 text-[12.5px] text-brand-900/55">
                Estos proveedores no aparecen en el gráfico porque no tienen fill rate que medir. No
                es un 0: es que todavía no se cerró ningún pedido suyo.
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {sinDatos.map((nombre) => (
                  <li
                    key={nombre}
                    className="rounded-md bg-brand-900/[0.04] px-2.5 py-1 text-[12.5px] text-brand-900/70"
                  >
                    {nombre}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Número grande con su etiqueta. Es la forma correcta para un dato único: un
 * gráfico de un solo valor no aporta nada que el número no diga mejor.
 */
function Indicador({
  valor,
  etiqueta,
  detalle,
  alerta = false,
}: {
  valor: string;
  etiqueta: string;
  detalle: string;
  alerta?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border px-4 py-3.5 ${
        alerta && valor !== '0' ? 'border-brand-wine/25 bg-brand-wine/[0.04]' : 'border-brand-900/10 bg-white'
      }`}
    >
      <p
        className={`font-display text-2xl font-semibold leading-none tabular-nums ${
          alerta && valor !== '0' ? 'text-brand-wine' : 'text-brand-900'
        }`}
      >
        {valor}
      </p>
      <p className="mt-1.5 text-[13px] font-medium text-brand-900/75">{etiqueta}</p>
      <p className="text-[11.5px] text-brand-900/45">{detalle}</p>
    </div>
  );
}

export default function ReporteCumplimientoEntregasPage() {
  const { esSistemas, esAdmin, esCalidad } = useAuth();

  return (
    <RoleRoute allow={esSistemas || esAdmin || esCalidad}>
      <Contenido />
    </RoleRoute>
  );
}
