import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/hooks/useAuth';
import * as horariosEntregaApi from '../api/horariosEntregaApi';
import { CLASIFICACIONES, type ClasificacionHorario, type TurnoFueraPlanificacion } from '../types';
import BadgeEstadoHorario from '../components/BadgeEstadoHorario';
import Card from '../../../shared/components/Card';
import Spinner from '../../../shared/components/Spinner';
import RoleRoute from '../../../routes/RoleRoute';

const ETIQUETA_DIA: Record<string, string> = {
  Lunes: 'Lunes', Martes: 'Martes', Miercoles: 'Miércoles', Jueves: 'Jueves',
  Viernes: 'Viernes', Sabado: 'Sábado', Domingo: 'Domingo',
};

/** "2099-03-05" -> "05/03" (se parte el texto: new Date() lo leería en UTC y retrocede un día). */
function fechaCorta(fecha: string | null | undefined): string {
  if (!fecha) return '';
  const [, mes, dia] = fecha.slice(0, 10).split('-');
  return `${dia}/${mes}`;
}

function TablaDelDia({ fecha, turnos }: { fecha: string; turnos: TurnoFueraPlanificacion[] }) {
  const dia = turnos[0]?.dia_entrega;

  return (
    <Card className="p-0 overflow-hidden">
      <div className="px-4 py-2.5 bg-brand-900/4 border-b border-brand-900/10">
        <h3 className="text-sm font-semibold text-brand-900">
          {ETIQUETA_DIA[dia] ?? dia} <span className="font-normal text-brand-900/50">{fechaCorta(fecha)}</span>
        </h3>
      </div>

      <div className="overflow-x-auto hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-brand-900/50 border-b border-brand-900/10">
              <th className="py-1.5 px-4">Llegada</th>
              <th className="py-1.5 px-2">Duración</th>
              <th className="py-1.5 px-2">Salida</th>
              <th className="py-1.5 px-2">Andén/Puerta</th>
              <th className="py-1.5 px-2">Código proveedor</th>
              <th className="py-1.5 px-2">Nombre proveedor</th>
              <th className="py-1.5 px-2">Estado</th>
              <th className="py-1.5 px-4">Arribo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-900/6">
            {turnos.map((t) => (
              <tr key={t.id_horario_entrega_proveedor}>
                <td className="py-1.5 px-4 font-semibold tabular-nums">{t.hora_llegada}</td>
                <td className="py-1.5 px-2">{t.tiempo_permanencia_min ?? '—'} min</td>
                <td className="py-1.5 px-2 tabular-nums">{t.hora_salida ?? '—'}</td>
                <td className="py-1.5 px-2 font-medium">{t.anden_puerta ?? '—'}</td>
                <td className="py-1.5 px-2 text-brand-900/60">{t.codigo_proveedor ?? '—'}</td>
                <td className="py-1.5 px-2">{t.nombre_proveedor}</td>
                <td className="py-1.5 px-2">
                  <BadgeEstadoHorario estado={t.estado} />
                </td>
                <td className="py-1.5 px-4 tabular-nums text-brand-900/70">{t.hora_arribo_real ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Celular: tarjetas, sin scroll horizontal (mismo criterio que el calendario). */}
      <div className="md:hidden divide-y divide-brand-900/6">
        {turnos.map((t) => (
          <div key={t.id_horario_entrega_proveedor} className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-brand-900 leading-tight truncate">{t.nombre_proveedor}</p>
                {t.codigo_proveedor && <p className="text-xs text-brand-900/50">{t.codigo_proveedor}</p>}
              </div>
              <BadgeEstadoHorario estado={t.estado} />
            </div>
            <div className="grid grid-cols-4 gap-2 text-sm">
              <div>
                <p className="text-[11px] uppercase text-brand-900/40">Llegada</p>
                <p className="font-semibold tabular-nums">{t.hora_llegada}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-brand-900/40">Duración</p>
                <p>{t.tiempo_permanencia_min ?? '—'} min</p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-brand-900/40">Salida</p>
                <p className="tabular-nums">{t.hora_salida ?? '—'}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-brand-900/40">Andén</p>
                <p>{t.anden_puerta ?? '—'}</p>
              </div>
            </div>
            {t.hora_arribo_real && <p className="text-xs text-brand-900/60">Arribó a las {t.hora_arribo_real}</p>}
          </div>
        ))}
      </div>
    </Card>
  );
}

function FueraPlanificacionContenido() {
  const [tab, setTab] = useState<ClasificacionHorario>('Perecibles');

  // Sin filtro de clasificación: una sola consulta para las 3 pestañas.
  const { data, isLoading } = useQuery({
    queryKey: ['horarios-entrega', 'fuera-planificacion'],
    queryFn: () => horariosEntregaApi.fueraPlanificacion(),
    refetchInterval: 60_000,
  });

  const ventanas = data?.ventanas[tab] ?? [];
  const delTab = useMemo(() => (data?.turnos ?? []).filter((t) => t.clasificacion === tab), [data, tab]);
  const porFecha = useMemo(() => {
    const grupos = new Map<string, TurnoFueraPlanificacion[]>();
    for (const t of delTab) {
      const fecha = t.fecha_fuera_planificacion ?? '';
      grupos.set(fecha, [...(grupos.get(fecha) ?? []), t]);
    }
    return [...grupos.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [delTab]);

  const etiquetaTab = CLASIFICACIONES.find((c) => c.valor === tab)?.etiqueta;

  return (
    <div className="max-w-6xl mx-auto w-full space-y-4">
      <div>
        <h1 className="font-display text-xl font-semibold text-brand-900 flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-brand-700">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <line x1="12" y1="13" x2="12" y2="19" />
            <line x1="9" y1="16" x2="15" y2="16" />
          </svg>
          Pedidos fuera de planificación
        </h1>
        <p className="text-brand-900/50 text-xs mt-0.5">
          Turnos extra de esta semana
          {data && (
            <>
              {' '}
              (semana que empezó el domingo {fechaCorta(data.inicio_ciclo)})
            </>
          )}
          . Se agendan en Business Central y aparecen aquí solos; cada domingo empieza una semana nueva.
        </p>
      </div>

      <div className="flex items-center gap-1 border-b border-brand-900/10">
        {CLASIFICACIONES.map((c) => {
          const cantidad = (data?.turnos ?? []).filter((t) => t.clasificacion === c.valor).length;
          return (
            <button
              key={c.valor}
              onClick={() => setTab(c.valor)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === c.valor ? 'border-brand-700 text-brand-900' : 'border-transparent text-brand-900/40 hover:text-brand-900/70'
              }`}
            >
              {c.etiqueta}
              {cantidad > 0 && <span className="ml-1.5 text-xs text-brand-900/45">({cantidad})</span>}
            </button>
          );
        })}
      </div>

      {data && (
        <Card className="px-4 py-3 space-y-2">
          <p className="text-xs font-semibold text-brand-900 uppercase tracking-wide">Ventanas de recepción de {etiquetaTab}</p>
          {ventanas.length === 0 ? (
            <p className="text-sm text-brand-900/60">Sin ventanas configuradas.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {ventanas.map((v) => (
                <span key={v.dia} className="text-sm rounded-md bg-brand-900/[0.04] px-2.5 py-1">
                  <span className="font-medium text-brand-900">{ETIQUETA_DIA[v.dia] ?? v.dia}</span>
                  <span className="text-brand-900/45"> {fechaCorta(v.fecha)}</span>
                  <span className="tabular-nums text-brand-900/80">
                    {' '}
                    {v.apertura} a {v.cierre}
                  </span>
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-brand-900/55">
            Turnos de {data.duraciones.join(', ')} minutos, uno a la vez por clasificación, y cada turno tiene que terminar a la hora
            de cierre. El Guardia puede registrar el arribo hasta {data.tolerancia_minutos} minutos después de la hora del turno;
            pasado ese tiempo ya no se registra.
          </p>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-6 w-6" />
        </div>
      ) : porFecha.length === 0 ? (
        <Card>
          <p className="text-sm text-brand-900/60 text-center py-10">
            No hay pedidos fuera de planificación de {etiquetaTab} esta semana.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {porFecha.map(([fecha, turnos]) => (
            <TablaDelDia key={fecha} fecha={fecha} turnos={turnos} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Pedidos fuera de planificación (19-nov-2026): los ven los mismos roles que
 * el calendario de horarios (Sistemas, Admin, Compras y Calidad; ver
 * HorarioEntregaService::verificarAccesoLectura). Solo lectura: se agendan en
 * Business Central. El Guardia los ve en Seguimiento de hoy.
 */
export default function FueraPlanificacionPage() {
  const { esSistemas, esAdmin, esCompras, esCalidad } = useAuth();

  return (
    <RoleRoute allow={esSistemas || esAdmin || esCompras || esCalidad}>
      <FueraPlanificacionContenido />
    </RoleRoute>
  );
}
