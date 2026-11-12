import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/hooks/useAuth';
import RoleRoute from '../../../routes/RoleRoute';
import Card from '../../../shared/components/Card';
import Spinner from '../../../shared/components/Spinner';
import Button from '../../../shared/components/Button';
import Badge from '../../../shared/components/Badge';
import BarraBusqueda from '../../../shared/components/BarraBusqueda';
import SelectFiltro from '../../../shared/components/SelectFiltro';
import { descargarExcel, nombreArchivoConFecha } from '../../../shared/utils/descargarExcel';
import * as historialApi from '../api/historialProveedoresApi';
import type { EntregaHistorial, ResumenProveedor } from '../api/historialProveedoresApi';

/**
 * REPORTE: HISTORIAL DE PROVEEDORES (12-nov-2026, pedido del usuario).
 *
 * Contesta "¿a qué hora llegó cada proveedor y cuánto se demora?". Cada
 * fila es una entrega: la hora a la que estaba citado, la hora real del
 * arribo y la diferencia en minutos. El resumen de arriba ordena a los
 * proveedores por atraso promedio, que es el ranking que se busca.
 *
 * LA RECEPCIÓN ES LA HORA REAL DE SIGH (12-nov-2026). Hasta ese día el
 * sincronizador guardaba la hora en que corría, y el 12-nov todas las
 * entregas salieron a las 11:38 (SIGH había estado caído hasta las
 * 11:37). Ahora se guarda la hora del ingreso a bodega en SIGH y el
 * histórico se corrigió, así que se puede medir la ESPERA: cuánto pasó
 * desde que el proveedor llegó hasta que lo recibieron.
 *
 * Una sola columna de recepción y no "recepción" y "entrega": en SIGH el
 * ingreso a bodega y el cierre del pedido son el mismo acto, así que las
 * dos horas son siempre iguales. Mostrar dos columnas idénticas era
 * justamente lo que parecía un error.
 *
 * La SALIDA es la programada en el calendario: el portal no registra la
 * hora en que se va el camión.
 *
 * Acceso: Sistemas, Admin y Compras (pedido del usuario, 12-nov).
 */

/** Rangos rápidos, en días. El backend topa en 3 meses. */
const RANGOS = [
  { dias: 7, etiqueta: 'Última semana' },
  { dias: 30, etiqueta: 'Último mes' },
  { dias: 92, etiqueta: 'Últimos 3 meses' },
];

const CLASIFICACIONES = [
  { valor: '', etiqueta: 'Todas las clasificaciones' },
  { valor: 'Perecibles', etiqueta: 'Perecibles' },
  { valor: 'No_Perecibles', etiqueta: 'No Perecibles' },
  { valor: 'Fruver', etiqueta: 'Fruver' },
];

const ESTADOS: Record<EntregaHistorial['estado_final'], { etiqueta: string; tono: 'success' | 'neutral' | 'danger' }> = {
  Recibido: { etiqueta: 'Recibido', tono: 'success' },
  En_Recepcion: { etiqueta: 'En recepción', tono: 'neutral' },
  Arribo: { etiqueta: 'Arribó', tono: 'neutral' },
  Sin_Arribo: { etiqueta: 'Sin arribo', tono: 'danger' },
};

function IconoDescarga() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function fechaHace(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() - (dias - 1));
  return d.toISOString().slice(0, 10);
}

function hoy(): string {
  return new Date().toISOString().slice(0, 10);
}

/** "2026-11-12" -> "12/11". El año se sobreentiende en un rango corto. */
function fechaCorta(valor: string | null): string {
  if (!valor) return '—';
  const [a, m, d] = valor.split('-');
  return a && m && d ? `${d}/${m}` : valor;
}

/**
 * La espera hasta la recepción. Negativa quiere decir que el Guardia marcó
 * el arribo DESPUÉS de que SIGH ya lo había recibido: no es una espera, es
 * un arribo marcado tarde, y se muestra como tal.
 */
function textoEspera(minutos: number | null): { texto: string; clase: string } {
  if (minutos === null) return { texto: '—', clase: 'text-brand-900/30' };
  if (minutos < 0) return { texto: 'arribo marcado tarde', clase: 'text-brand-900/40 italic' };
  if (minutos < 60) return { texto: `${minutos} min`, clase: 'text-brand-900/80' };
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return { texto: `${h} h ${m} min`, clase: minutos > 120 ? 'text-brand-wine font-medium' : 'text-amber-700' };
}

/** El atraso, en palabras y con su color. */
function textoAtraso(minutos: number | null): { texto: string; clase: string } {
  if (minutos === null) return { texto: '—', clase: 'text-brand-900/30' };
  if (minutos <= -1) return { texto: `${Math.abs(minutos)} min antes`, clase: 'text-emerald-700' };
  if (minutos === 0) return { texto: 'a la hora', clase: 'text-emerald-700' };
  if (minutos <= 15) return { texto: `+${minutos} min`, clase: 'text-amber-700' };
  return { texto: `+${minutos} min`, clase: 'text-brand-wine font-medium' };
}

export default function ReporteHistorialProveedoresPage() {
  // Calidad, Admin y Sistemas, igual que HistorialEntregasService.
  // Sistemas, Admin y Compras, igual que HistorialEntregasService::verificarAcceso.
  const { esSistemas, esAdmin, esCompras } = useAuth();
  const tieneAcceso = esSistemas || esAdmin || esCompras;

  const [desde, setDesde] = useState(fechaHace(30));
  const [hasta, setHasta] = useState(hoy());
  const [clasificacion, setClasificacion] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [vista, setVista] = useState<'proveedor' | 'entregas'>('proveedor');

  const consulta = useQuery({
    queryKey: ['historial-proveedores', desde, hasta, clasificacion],
    queryFn: () => historialApi.consultar({ desde, hasta, clasificacion: clasificacion || undefined }),
    enabled: tieneAcceso,
  });

  const termino = busqueda.trim().toLowerCase();

  const coincide = (nombre: string | null, ruc: string | null) =>
    !termino || [nombre, ruc].filter(Boolean).some((campo) => campo!.toLowerCase().includes(termino));

  const porProveedor = useMemo(
    () => (consulta.data?.por_proveedor ?? []).filter((p) => coincide(p.proveedor, p.ruc)),
    [consulta.data, termino]
  );

  const entregas = useMemo(
    () => (consulta.data?.entregas ?? []).filter((e) => coincide(e.proveedor, e.ruc)),
    [consulta.data, termino]
  );

  function aplicarRango(dias: number) {
    setDesde(fechaHace(dias));
    setHasta(hoy());
  }

  async function exportar() {
    if (vista === 'proveedor') {
      await descargarExcel(
        porProveedor.map((p) => ({
          Proveedor: p.proveedor ?? '',
          RUC: p.ruc ?? '',
          Entregas: p.entregas,
          'A tiempo': p.a_tiempo,
          Tarde: p.tarde,
          'Sin arribo marcado': p.sin_arribo_marcado,
          'Atraso promedio (min)': p.atraso_promedio ?? '',
          'Atraso máximo (min)': p.atraso_maximo ?? '',
          'Espera promedio hasta la recepción (min)': p.espera_promedio ?? '',
          Recibidas: p.recibidas,
        })),
        'Por proveedor',
        nombreArchivoConFecha('historial-proveedores')
      );
      return;
    }

    await descargarExcel(
      entregas.map((e) => ({
        Fecha: e.fecha ?? '',
        Proveedor: e.proveedor ?? '',
        RUC: e.ruc ?? '',
        Clasificación: e.clasificacion ?? '',
        'Andén': e.anden_puerta ?? '',
        Programada: e.hora_programada ?? '',
        Arribo: e.hora_arribo ?? '',
        'Atraso (min)': e.minutos_atraso ?? '',
        'Recepción en SIGH': e.hora_recepcion ?? '',
        'Espera (min)': e.minutos_espera ?? '',
        'Salida programada': e.hora_salida ?? '',
        Documento: e.nro_documento_bc ?? '',
        Estado: ESTADOS[e.estado_final].etiqueta,
      })),
      'Entregas',
      nombreArchivoConFecha('historial-entregas')
    );
  }

  return (
    <RoleRoute allow={tieneAcceso}>
      <div className="space-y-4">
        <div>
          <h1 className="font-display text-xl font-semibold text-brand-900">Historial de proveedores</h1>
          <p className="text-sm text-brand-900/60">
            A qué hora estaba citado cada proveedor, a qué hora llegó y cuánto se demoró. Hasta 3 meses atrás.
          </p>
        </div>

        <Card className="space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-brand-900/60 mb-1" htmlFor="historial-desde">Desde</label>
              <input
                id="historial-desde"
                type="date"
                value={desde}
                max={hasta}
                onChange={(e) => setDesde(e.target.value)}
                className="min-h-10 rounded-lg border border-brand-900/15 px-3 text-sm focus:outline-none focus:border-brand-700"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-900/60 mb-1" htmlFor="historial-hasta">Hasta</label>
              <input
                id="historial-hasta"
                type="date"
                value={hasta}
                min={desde}
                max={hoy()}
                onChange={(e) => setHasta(e.target.value)}
                className="min-h-10 rounded-lg border border-brand-900/15 px-3 text-sm focus:outline-none focus:border-brand-700"
              />
            </div>

            <div className="flex items-center gap-1.5">
              {RANGOS.map((r) => (
                <button
                  key={r.dias}
                  type="button"
                  onClick={() => aplicarRango(r.dias)}
                  className="min-h-10 px-3 rounded-full text-xs font-medium bg-brand-900/6 text-brand-900/60 hover:bg-brand-900/12 hover:text-brand-900"
                >
                  {r.etiqueta}
                </button>
              ))}
            </div>

            <SelectFiltro
              valor={clasificacion}
              onCambiar={setClasificacion}
              opciones={CLASIFICACIONES.map((c) => ({ valor: c.valor, etiqueta: c.etiqueta }))}
            />

            <BarraBusqueda valor={busqueda} onCambiar={setBusqueda} placeholder="Buscar proveedor o RUC..." />

            <Button
              variant="ghost"
              className="text-xs px-3 py-2 flex items-center gap-1.5 ml-auto"
              disabled={consulta.isLoading || (vista === 'proveedor' ? porProveedor.length === 0 : entregas.length === 0)}
              onClick={exportar}
            >
              <IconoDescarga />
              Excel
            </Button>
          </div>

          <div className="flex items-center gap-1.5 border-t border-brand-900/8 pt-3">
            {(['proveedor', 'entregas'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVista(v)}
                className={`min-h-9 px-4 rounded-full text-xs font-medium transition-colors ${
                  vista === v ? 'bg-brand-900 text-white' : 'bg-brand-900/6 text-brand-900/50 hover:bg-brand-900/12'
                }`}
              >
                {v === 'proveedor' ? 'Resumen por proveedor' : 'Entrega por entrega'}
              </button>
            ))}
          </div>
        </Card>

        <p className="text-xs text-brand-900/45">
          El <strong>atraso</strong> compara la hora citada con la de llegada, que marca el Guardia. La{' '}
          <strong>recepción</strong> es la hora real del ingreso a bodega en SIGH (es también la del cierre del pedido),
          y la <strong>espera</strong> es lo que pasó entre la llegada y la recepción. La <strong>salida</strong> es la
          programada en el calendario: la hora real de salida no se registra.
        </p>

        {consulta.isLoading ? (
          <Card>
            <Spinner />
          </Card>
        ) : vista === 'proveedor' ? (
          <TablaPorProveedor filas={porProveedor} />
        ) : (
          <TablaEntregas filas={entregas} />
        )}
      </div>
    </RoleRoute>
  );
}

function TablaPorProveedor({ filas }: { filas: ResumenProveedor[] }) {
  if (filas.length === 0) {
    return (
      <Card>
        <p className="text-sm text-brand-900/50 text-center py-8">
          No hay entregas registradas en el rango elegido.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-0 overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-brand-900/4 text-xs uppercase tracking-wide text-brand-900/50">
          <tr>
            <th className="px-4 sm:px-5 py-2.5">Proveedor</th>
            <th className="px-3 py-2.5 text-center">Entregas</th>
            <th className="px-3 py-2.5 text-center">A tiempo</th>
            <th className="px-3 py-2.5 text-center">Tarde</th>
            <th className="px-3 py-2.5 text-center">Atraso promedio</th>
            <th className="px-3 py-2.5 text-center">Peor atraso</th>
            <th className="px-3 py-2.5 text-center">Espera promedio</th>
            <th className="px-3 py-2.5 text-center">Sin arribo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-900/6">
          {filas.map((p) => {
            const promedio = textoAtraso(p.atraso_promedio);

            return (
              <tr key={p.id_proveedor} className="hover:bg-brand-900/3">
                <td className="px-4 sm:px-5 py-2.5">
                  <p className="font-medium text-brand-900">{p.proveedor ?? 'Proveedor sin nombre'}</p>
                  <p className="text-xs text-brand-900/45">{p.ruc ?? 'sin RUC'}</p>
                </td>
                <td className="px-3 py-2.5 text-center tabular-nums">{p.entregas}</td>
                <td className="px-3 py-2.5 text-center tabular-nums text-emerald-700">{p.a_tiempo}</td>
                <td className="px-3 py-2.5 text-center tabular-nums text-brand-wine">{p.tarde}</td>
                <td className={`px-3 py-2.5 text-center tabular-nums ${promedio.clase}`}>{promedio.texto}</td>
                <td className="px-3 py-2.5 text-center tabular-nums text-brand-900/70">
                  {p.atraso_maximo === null ? '—' : `+${p.atraso_maximo} min`}
                </td>
                <td className={`px-3 py-2.5 text-center tabular-nums ${textoEspera(p.espera_promedio).clase}`}>
                  {textoEspera(p.espera_promedio).texto}
                </td>
                <td className="px-3 py-2.5 text-center tabular-nums text-brand-900/40">
                  {p.sin_arribo_marcado || '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

function TablaEntregas({ filas }: { filas: EntregaHistorial[] }) {
  if (filas.length === 0) {
    return (
      <Card>
        <p className="text-sm text-brand-900/50 text-center py-8">
          No hay entregas registradas en el rango elegido.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-0 overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-brand-900/4 text-xs uppercase tracking-wide text-brand-900/50">
          <tr>
            <th className="px-4 sm:px-5 py-2.5">Fecha</th>
            <th className="px-3 py-2.5">Proveedor</th>
            <th className="px-3 py-2.5 text-center">Citado</th>
            <th className="px-3 py-2.5 text-center">Llegó</th>
            <th className="px-3 py-2.5 text-center">Diferencia</th>
            <th className="px-3 py-2.5 text-center">Recepción</th>
            <th className="px-3 py-2.5 text-center">Espera</th>
            <th className="px-3 py-2.5 text-center" title="Salida programada en el calendario">Salida prog.</th>
            <th className="px-3 py-2.5">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-900/6">
          {filas.map((e) => {
            const atraso = textoAtraso(e.minutos_atraso);
            const estado = ESTADOS[e.estado_final];

            return (
              <tr key={e.id_horario_entrega_estado_diario} className="hover:bg-brand-900/3">
                <td className="px-4 sm:px-5 py-2.5 tabular-nums text-brand-900/70">{fechaCorta(e.fecha)}</td>
                <td className="px-3 py-2.5">
                  <p className="text-brand-900">{e.proveedor ?? 'Proveedor sin nombre'}</p>
                  <p className="text-[11px] text-brand-900/40">
                    {e.clasificacion ?? 'sin clasificación'}
                    {e.anden_puerta ? ` · andén ${e.anden_puerta}` : ''}
                  </p>
                </td>
                <td className="px-3 py-2.5 text-center tabular-nums">{e.hora_programada ?? '—'}</td>
                <td className="px-3 py-2.5 text-center tabular-nums font-medium">{e.hora_arribo ?? '—'}</td>
                <td className={`px-3 py-2.5 text-center tabular-nums ${atraso.clase}`}>{atraso.texto}</td>
                <td className="px-3 py-2.5 text-center tabular-nums">{e.hora_recepcion ?? '—'}</td>
                <td className={`px-3 py-2.5 text-center tabular-nums ${textoEspera(e.minutos_espera).clase}`}>
                  {textoEspera(e.minutos_espera).texto}
                </td>
                <td className="px-3 py-2.5 text-center tabular-nums text-brand-900/45">{e.hora_salida ?? '—'}</td>
                <td className="px-3 py-2.5">
                  <Badge tone={estado.tono}>{estado.etiqueta}</Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
