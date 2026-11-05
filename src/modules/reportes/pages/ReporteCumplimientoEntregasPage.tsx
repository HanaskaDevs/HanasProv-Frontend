// src/modules/reportes/pages/ReporteCumplimientoEntregasPage.tsx
import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/hooks/useAuth';
import RoleRoute from '../../../routes/RoleRoute';
import Card from '../../../shared/components/Card';
import Spinner from '../../../shared/components/Spinner';
import Button from '../../../shared/components/Button';
import * as reportesApi from '../api/reportesApi';
import type { FiltrosFillRate } from '../api/reportesApi';
import GraficoBarras, { type BarraDato } from '../components/GraficoBarras';

/** Meta de fill rate contra la que se compara. */
const META_FILL_RATE = 95;

/**
 * Hasta cuántos días atrás se puede filtrar por fecha de recepción (05-nov-2026,
 * pedido del usuario). El servidor aplica el mismo límite
 * (CalificacionGlobalController::DIAS_ATRAS_FILTRO_FILL_RATE).
 */
const DIAS_ATRAS = 5;

const CLASE_CAMPO =
  'w-full rounded-md border border-brand-900/15 bg-white px-3 py-1.5 text-sm text-brand-900 ' +
  'focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/15';

/** AAAA-MM-DD de una fecha LOCAL (toISOString pasaría a UTC y correría el día). */
function aIso(fecha: Date): string {
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${m}-${d}`;
}

/** dd/mm/aaaa a partir de AAAA-MM-DD, sin pasar por Date (evita el corrimiento por zona horaria). */
function aTexto(iso: string | null): string {
  if (!iso) return '—';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

interface Semana {
  desde: string;
  hasta: string;
  etiqueta: string;
}

/** Rango permitido para filtrar: de hoy menos DIAS_ATRAS a hoy (AAAA-MM-DD). */
function rangoPermitido(): { minimo: string; maximo: string } {
  const hoy = new Date();
  const minimo = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - DIAS_ATRAS);
  return { minimo: aIso(minimo), maximo: aIso(hoy) };
}

/**
 * Esta semana y la anterior (lunes a domingo), recortadas al rango permitido:
 * con el límite de días, una semana más vieja ya no tendría ningún día
 * elegible. Si la semana anterior queda fuera del todo, no se ofrece.
 */
function semanasRecientes(minimo: string, maximo: string): Semana[] {
  const hoy = new Date();
  const lunes = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  // getDay(): 0 = domingo. Se lleva al lunes de esta semana.
  lunes.setDate(lunes.getDate() - ((lunes.getDay() + 6) % 7));

  return [0, 1]
    .map((i) => {
      const inicio = new Date(lunes);
      inicio.setDate(lunes.getDate() - 7 * i);
      const fin = new Date(inicio);
      fin.setDate(inicio.getDate() + 6);
      // Las fechas AAAA-MM-DD se comparan bien como texto.
      const desde = aIso(inicio) < minimo ? minimo : aIso(inicio);
      const hasta = aIso(fin) > maximo ? maximo : aIso(fin);
      const rango = `${aTexto(desde).slice(0, 5)} al ${aTexto(hasta)}`;
      return { desde, hasta, etiqueta: i === 0 ? `Esta semana (${rango})` : `Semana anterior (${rango})` };
    })
    .filter((s) => s.desde <= s.hasta);
}

/** Lleva una fecha escrita a mano dentro del rango permitido. */
function acotar(fecha: string, minimo: string, maximo: string): string {
  if (fecha < minimo) return minimo;
  if (fecha > maximo) return maximo;
  return fecha;
}

/** Color del porcentaje, con los mismos cortes que los indicadores. */
function colorPorcentaje(valor: number): string {
  if (valor >= META_FILL_RATE) return 'text-[#3B6D11]';
  if (valor < 75) return 'text-brand-wine';
  return 'text-brand-900';
}

/**
 * Reporte de Cumplimiento de entregas: el fill rate de los proveedores, en
 * barras y ordenado.
 *
 * POR QUÉ BARRAS Y NO RADAR: acá se compara UN indicador entre MUCHOS
 * proveedores. Un radar sirve para lo contrario (varios ejes de pocos
 * proveedores). Con un solo indicador, la longitud de una barra es la
 * codificación más precisa que existe para comparar magnitudes.
 *
 * Filtros (05-nov-2026, pedido de Calidad para el seguimiento): semana, UNA
 * fecha de recepción y proveedor. La semana manda un rango lunes-domingo; la
 * fecha, ese día solo (desde = hasta). Primero hubo desde/hasta, pero con el
 * tope de DIAS_ATRAS días el rango sobraba (pedido del usuario, mismo día).
 * "Fecha de recepción" es la fecha de recepción esperada del pedido, la que
 * trae BC. Sin filtros se ve lo mismo que antes: todos los pedidos cerrados,
 * igual que la nota. El API sigue recibiendo desde/hasta.
 *
 * Con un proveedor elegido se listan sus pedidos del periodo con el % de cada
 * uno, que es lo que hace falta para hablar con él de un pedido concreto.
 */
function Contenido() {
  const [filtros, setFiltros] = useState<FiltrosFillRate>({});
  const { minimo, maximo } = useMemo(() => rangoPermitido(), []);
  const semanas = useMemo(() => semanasRecientes(minimo, maximo), [minimo, maximo]);

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ['reporte-fill-rate', filtros],
    queryFn: () => reportesApi.obtenerReporteFillRate(filtros),
    placeholderData: keepPreviousData,
  });

  const semanaElegida = semanas.find((s) => s.desde === filtros.desde && s.hasta === filtros.hasta);
  // Un día suelto (desde = hasta) es lo que eligió el campo de fecha.
  const diaElegido = filtros.desde && filtros.desde === filtros.hasta ? filtros.desde : '';
  const hayFiltros = !!(filtros.desde || filtros.hasta || filtros.id_proveedor);

  const { conDatos, promedio } = useMemo(() => {
    const conDatos: BarraDato[] = (data?.proveedores ?? []).map((p) => ({
      etiqueta: p.razon_social ?? 'Sin razón social',
      valor: p.porcentaje,
      detalle: `${p.pedidos} pedido${p.pedidos === 1 ? '' : 's'} cerrado${p.pedidos === 1 ? '' : 's'}`,
    }));
    conDatos.sort((a, b) => b.valor - a.valor);

    const promedio =
      conDatos.length > 0 ? conDatos.reduce((suma, d) => suma + d.valor, 0) / conDatos.length : null;

    return { conDatos, promedio };
  }, [data]);

  const sinDatos = data?.sin_pedidos ?? [];
  const detalle = data?.detalle ?? [];
  const nombreProveedor = data?.opciones_proveedor.find((p) => p.id_proveedor === filtros.id_proveedor)?.razon_social;

  function cambiarSemana(valor: string) {
    const semana = semanas.find((s) => s.desde === valor);
    setFiltros((f) => ({ ...f, desde: semana?.desde, hasta: semana?.hasta }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-brand-900">Cumplimiento de entregas</h1>
        <p className="text-sm text-brand-900/60 mt-1">
          Fill rate de cada proveedor: el promedio de lo entregado en sus pedidos ya cerrados.
        </p>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1.6fr_auto] lg:items-end">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-brand-900/70">Semana</span>
            <select
              className={CLASE_CAMPO}
              value={semanaElegida?.desde ?? ''}
              onChange={(e) => cambiarSemana(e.target.value)}
            >
              <option value="">{diaElegido ? 'Un día (ver fecha)' : 'Todas las fechas'}</option>
              {semanas.map((s) => (
                <option key={s.desde} value={s.desde}>
                  {s.etiqueta}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-brand-900/70">Fecha de recepción</span>
            <input
              type="date"
              className={CLASE_CAMPO}
              value={diaElegido}
              min={minimo}
              max={maximo}
              onChange={(e) => {
                const dia = e.target.value ? acotar(e.target.value, minimo, maximo) : undefined;
                setFiltros((f) => ({ ...f, desde: dia, hasta: dia }));
              }}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-brand-900/70">Proveedor</span>
            <select
              className={CLASE_CAMPO}
              value={filtros.id_proveedor ?? ''}
              onChange={(e) =>
                setFiltros((f) => ({ ...f, id_proveedor: e.target.value ? Number(e.target.value) : undefined }))
              }
            >
              <option value="">Todos los proveedores</option>
              {(data?.opciones_proveedor ?? []).map((p) => (
                <option key={p.id_proveedor} value={p.id_proveedor}>
                  {p.razon_social ?? 'Sin razón social'}
                  {p.ruc ? ` · ${p.ruc}` : ''}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-center gap-2 lg:pb-0.5">
            {hayFiltros && (
              <Button variant="ghost" className="text-xs px-3 py-2" onClick={() => setFiltros({})}>
                Limpiar
              </Button>
            )}
            {isFetching && !isLoading && <Spinner className="h-4 w-4" />}
          </div>
        </div>
        <p className="mt-2.5 text-[11.5px] text-brand-900/45">
          La fecha de recepción es la fecha de recepción esperada de cada pedido en Business Central. Se puede
          elegir hasta {DIAS_ATRAS} días atrás (desde el {aTexto(minimo)}); muestra los pedidos de ese día.
        </p>
      </Card>

      {isLoading ? (
        <Card>
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        </Card>
      ) : isError ? (
        <Card>
          <p className="py-10 text-center text-sm text-brand-wine">No se pudo cargar el reporte. Intenta de nuevo.</p>
        </Card>
      ) : (
        <>
          {promedio !== null && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Indicador
                valor={`${promedio.toFixed(1)}%`}
                etiqueta={filtros.id_proveedor ? 'Fill rate del proveedor' : 'Fill rate promedio'}
                detalle={
                  filtros.id_proveedor
                    ? `${detalle.length} pedido${detalle.length === 1 ? '' : 's'} cerrado${detalle.length === 1 ? '' : 's'}`
                    : `${conDatos.length} proveedor${conDatos.length === 1 ? '' : 'es'} con pedidos cerrados`
                }
              />
              {/* Con un proveedor elegido se cuentan SUS PEDIDOS; sin él, proveedores. */}
              <Indicador
                valor={String(
                  filtros.id_proveedor
                    ? detalle.filter((p) => p.porcentaje >= META_FILL_RATE).length
                    : conDatos.filter((d) => d.valor >= META_FILL_RATE).length
                )}
                etiqueta={`En meta (${META_FILL_RATE}% o más)`}
                detalle={filtros.id_proveedor ? 'Pedidos que cumplen lo esperado' : 'Proveedores que cumplen lo esperado'}
              />
              <Indicador
                valor={String(
                  filtros.id_proveedor
                    ? detalle.filter((p) => p.porcentaje < 75).length
                    : conDatos.filter((d) => d.valor < 75).length
                )}
                etiqueta="Por debajo del 75%"
                detalle={filtros.id_proveedor ? 'Pedidos para revisar con el proveedor' : 'Proveedores que necesitan seguimiento'}
                alerta
              />
            </div>
          )}

          {!filtros.id_proveedor && (
            <Card>
              <p className="font-display text-base font-semibold text-brand-900 mb-1">Fill rate por proveedor</p>
              <p className="text-[12.5px] text-brand-900/55 mb-5">
                Ordenado de mayor a menor. La línea punteada es la meta del {META_FILL_RATE}%.
              </p>
              {conDatos.length === 0 ? (
                <p className="py-8 text-center text-sm text-brand-900/50">
                  No hay pedidos cerrados con fecha de recepción en el periodo elegido.
                </p>
              ) : (
                <GraficoBarras
                  datos={conDatos}
                  referencia={META_FILL_RATE}
                  etiquetaReferencia={`Meta: ${META_FILL_RATE}% de cumplimiento`}
                />
              )}
            </Card>
          )}

          {filtros.id_proveedor !== undefined && (
            <Card className="p-0 overflow-hidden">
              <div className="px-5 pt-4 pb-3">
                <p className="font-display text-base font-semibold text-brand-900">
                  Pedidos de {nombreProveedor ?? 'este proveedor'}
                </p>
                <p className="text-[12.5px] text-brand-900/55">
                  Pedidos cerrados del periodo elegido, por fecha de recepción. El % de cada uno es lo recibido sobre lo
                  pedido; lo que se entrega de más en una línea no compensa lo que falta en otra.
                </p>
              </div>
              {detalle.length === 0 ? (
                <p className="px-5 pb-8 pt-4 text-center text-sm text-brand-900/50">
                  Este proveedor no tiene pedidos cerrados con fecha de recepción en el periodo elegido.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-y border-brand-900/8 bg-brand-900/[0.025] text-left text-[11.5px] uppercase tracking-wide text-brand-900/50">
                        <th className="px-5 py-2 font-medium">Pedido</th>
                        <th className="px-3 py-2 font-medium">Fecha de recepción</th>
                        <th className="px-3 py-2 text-right font-medium">Pedido (cant.)</th>
                        <th className="px-3 py-2 text-right font-medium">Recibido</th>
                        <th className="px-5 py-2 text-right font-medium">Fill rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-900/6">
                      {detalle.map((p) => (
                        <tr key={p.id_pedido}>
                          <td className="px-5 py-2.5 font-medium text-brand-900">{p.nro_pedido}</td>
                          <td className="px-3 py-2.5 text-brand-900/75 tabular-nums">{aTexto(p.fecha_recepcion)}</td>
                          <td className="px-3 py-2.5 text-right text-brand-900/75 tabular-nums">
                            {p.cantidad.toLocaleString('es-EC')}
                          </td>
                          <td className="px-3 py-2.5 text-right text-brand-900/75 tabular-nums">
                            {p.recibida.toLocaleString('es-EC')}
                          </td>
                          <td className={`px-5 py-2.5 text-right font-semibold tabular-nums ${colorPorcentaje(p.porcentaje)}`}>
                            {p.porcentaje.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

          {!filtros.id_proveedor && sinDatos.length > 0 && (
            <Card>
              <p className="text-sm font-medium text-brand-900">
                {hayFiltros ? 'Sin pedidos cerrados en el periodo elegido' : 'Sin pedidos cerrados todavía'}
              </p>
              <p className="mt-1 text-[12.5px] text-brand-900/55">
                Estos proveedores no aparecen en el gráfico porque no tienen fill rate que medir. No es un 0: es
                que no tienen ningún pedido cerrado {hayFiltros ? 'con fecha de recepción en el periodo elegido' : 'todavía'}.
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {sinDatos.map((nombre, i) => (
                  <li
                    key={`${nombre}-${i}`}
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
