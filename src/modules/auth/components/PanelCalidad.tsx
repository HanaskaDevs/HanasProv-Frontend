import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Card from '../../../shared/components/Card';
import Spinner from '../../../shared/components/Spinner';
import * as auditoriasApi from '../../auditorias/api/auditoriasApi';
import * as recepcionesApi from '../../auditorias/api/recepcionesApi';

function IconoAuditoria({ className = '' }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

function IconoRecepcion({ className = '' }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="M3.3 7 12 12l8.7-5M12 22V12" />
    </svg>
  );
}

function IconoBorrador({ className = '' }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function TarjetaStat({
  icono,
  valor,
  etiqueta,
  color,
  to,
}: {
  icono: React.ReactNode;
  valor: number | string;
  etiqueta: string;
  color: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="rounded-lg border border-brand-900/8 bg-white p-4 flex items-center gap-3 hover:border-brand-900/20 hover:shadow-sm transition-all"
    >
      <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${color}`}>{icono}</div>
      <div className="min-w-0">
        <p className="text-xl font-semibold text-brand-900 leading-tight">{valor}</p>
        <p className="text-xs text-brand-900/55 truncate">{etiqueta}</p>
      </div>
    </Link>
  );
}

function colorPorcentaje(porcentaje: number): string {
  if (porcentaje >= 85) return 'text-emerald-700';
  if (porcentaje >= 70) return 'text-orange-600';
  return 'text-brand-wine';
}

function formatearFecha(fecha: string | null): string {
  if (!fecha) return '—';
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short' });
}

/**
 * Panel de Inicio para Calidad -> antes esta pantalla solo tenía el
 * cartel genérico "usa el menú lateral..." (pedido explícito del
 * usuario, 27-ago-2026). Junta lo más relevante de sus 2 herramientas
 * principales (Auditorías y Calificación de Recepciones) en una sola
 * pantalla, con datos reales de la empresa activa, no inventados.
 */
export default function PanelCalidad() {
  const { data: resumenAuditorias, isLoading: cargandoAuditorias } = useQuery({
    queryKey: ['resumen-auditorias-dashboard'],
    queryFn: auditoriasApi.obtenerResumen,
  });

  const { data: proveedoresRecepcion, isLoading: cargandoRecepcion } = useQuery({
    queryKey: ['recepciones-proveedores'],
    queryFn: recepcionesApi.listarProveedores,
  });

  const { data: historialRecepcion, isLoading: cargandoHistorial } = useQuery({
    queryKey: ['recepciones-historial'],
    queryFn: recepcionesApi.listarHistorial,
  });

  const cargando = cargandoAuditorias || cargandoRecepcion || cargandoHistorial;

  const proveedoresPendientesHoy = (proveedoresRecepcion ?? []).filter(
    (p) => p.le_toca_hoy && p.puede_calificar
  );

  const ultimasRecepciones = (historialRecepcion ?? []).slice(0, 5);

  if (cargando) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <TarjetaStat
          icono={<IconoAuditoria />}
          valor={resumenAuditorias?.auditorias_mes ?? 0}
          etiqueta="Auditorías este mes"
          color="text-brand-700 bg-brand-700/10"
          to="/auditorias"
        />
        <TarjetaStat
          icono={<IconoAuditoria />}
          valor={
            resumenAuditorias?.promedio_cumplimiento_mes !== null && resumenAuditorias?.promedio_cumplimiento_mes !== undefined
              ? `${resumenAuditorias.promedio_cumplimiento_mes}%`
              : '—'
          }
          etiqueta="Cumplimiento promedio"
          color="text-emerald-700 bg-emerald-700/10"
          to="/auditorias"
        />
        <TarjetaStat
          icono={<IconoBorrador />}
          valor={resumenAuditorias?.auditorias_en_borrador ?? 0}
          etiqueta="Auditorías en borrador"
          color="text-orange-600 bg-orange-100"
          to="/auditorias"
        />
        <TarjetaStat
          icono={<IconoRecepcion />}
          valor={proveedoresPendientesHoy.length}
          etiqueta="Recepciones para hoy"
          color="text-sky-700 bg-sky-100"
          to="/auditorias/recepciones"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <h3 className="font-display text-xs font-bold text-brand-900 uppercase tracking-wide">
              Proveedores que tocan hoy
            </h3>
            <Link to="/auditorias/recepciones" className="text-xs font-medium text-brand-700 hover:underline">
              Ir a calificar
            </Link>
          </div>

          {proveedoresPendientesHoy.length === 0 ? (
            <p className="text-sm text-brand-900/50 px-5 pb-5 pt-2">
              Ningún proveedor tiene recepción asignada para hoy.
            </p>
          ) : (
            <div className="divide-y divide-brand-900/6">
              {proveedoresPendientesHoy.slice(0, 6).map((p) => (
                <Link
                  key={p.id_proveedor}
                  to="/auditorias/recepciones"
                  className="flex items-center justify-between gap-3 px-5 py-2.5 hover:bg-brand-900/[0.02]"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-brand-900 truncate">
                      {p.nombre_comercial ?? p.razon_social}
                    </p>
                    <p className="text-[12px] text-brand-900/45">
                      {p.calificaciones_del_anio}/2 calificaciones este año
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-md bg-sky-100 text-sky-700">
                    Pendiente
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <h3 className="font-display text-xs font-bold text-brand-900 uppercase tracking-wide">
              Últimas calificaciones de recepción
            </h3>
            <Link to="/auditorias/recepciones" className="text-xs font-medium text-brand-700 hover:underline">
              Ver todas
            </Link>
          </div>

          {ultimasRecepciones.length === 0 ? (
            <p className="text-sm text-brand-900/50 px-5 pb-5 pt-2">Todavía no hay calificaciones registradas.</p>
          ) : (
            <div className="divide-y divide-brand-900/6">
              {ultimasRecepciones.map((h) => (
                <div key={h.id_calificacion_recepcion} className="flex items-center justify-between gap-3 px-5 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-brand-900 truncate">{h.proveedor ?? 'Proveedor'}</p>
                    <p className="text-[12px] text-brand-900/45">{formatearFecha(h.fecha_recepcion)}</p>
                  </div>
                  <span className={`shrink-0 text-sm font-semibold ${colorPorcentaje(h.porcentaje_obtenido)}`}>
                    {h.porcentaje_obtenido}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {(resumenAuditorias?.ultimas ?? []).length > 0 && (
        <Card className="p-0 overflow-hidden">
          <div className="px-5 pt-4 pb-2">
            <h3 className="font-display text-xs font-bold text-brand-900 uppercase tracking-wide">
              Últimas auditorías finalizadas
            </h3>
          </div>
          <div className="divide-y divide-brand-900/6">
            {(resumenAuditorias?.ultimas ?? []).map((a) => (
              <Link
                key={a.id_auditoria}
                to="/auditorias"
                className="flex items-center justify-between gap-3 px-5 py-2.5 hover:bg-brand-900/[0.02]"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-brand-900 truncate">{a.proveedor ?? 'Proveedor'}</p>
                  <p className="text-[12px] text-brand-900/45">{formatearFecha(a.fecha_auditoria)}</p>
                </div>
                <span className={`shrink-0 text-sm font-semibold ${colorPorcentaje(a.porcentaje_cumplimiento)}`}>
                  {a.porcentaje_cumplimiento}%
                </span>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
