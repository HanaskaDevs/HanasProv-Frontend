import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { obtenerPlanContingenciaNino } from '../api/reportesApi';

/**
 * Tarjeta del panel de inicio (Sistemas, Admin y Calidad): cuántos
 * proveedores ya cargaron su Plan de contingencia contra el fenómeno del
 * Niño. El detalle, con quiénes lo cargaron y quiénes no, está en
 * /reportes/plan-contingencia-nino.
 */
export default function TarjetaPlanContingencia() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['plan-contingencia-nino'],
    queryFn: obtenerPlanContingenciaNino,
  });

  const total = data?.total_proveedores ?? 0;
  const cargaron = data?.cargaron ?? 0;
  const porcentaje = total > 0 ? Math.round((cargaron / total) * 100) : 0;

  return (
    <Link
      to="/reportes/plan-contingencia-nino"
      className="group block rounded-lg border border-brand-900/8 bg-white p-4 hover:border-brand-700/30 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="h-10 w-10 shrink-0 rounded-lg flex items-center justify-center text-sky-700 bg-sky-100">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 16.2A4.5 4.5 0 0 0 17.5 8h-1.8A7 7 0 1 0 4 14.9" />
              <line x1="8" y1="19" x2="8" y2="21" />
              <line x1="8" y1="13" x2="8" y2="15" />
              <line x1="16" y1="19" x2="16" y2="21" />
              <line x1="16" y1="13" x2="16" y2="15" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="12" y1="15" x2="12" y2="17" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-brand-900">Plan de contingencia · Fenómeno del Niño</p>
            <p className="text-xs text-brand-900/50">
              {isLoading
                ? 'Cargando...'
                : isError
                  ? 'No se pudo cargar el seguimiento.'
                  : total === 0
                    ? 'Todavía no hay proveedores en esta empresa.'
                    : `${cargaron} de ${total} proveedores ya lo cargaron`}
            </p>
          </div>
        </div>
        {!isLoading && !isError && total > 0 && (
          <span className="shrink-0 font-display text-2xl font-semibold text-brand-900">{porcentaje}%</span>
        )}
      </div>

      {!isLoading && !isError && total > 0 && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-brand-900/8" aria-hidden="true">
          <div className="h-full rounded-full bg-sky-600 transition-all" style={{ width: `${porcentaje}%` }} />
        </div>
      )}

      <p className="mt-3 text-xs font-medium text-brand-700 group-hover:underline">Ver qué proveedores lo cargaron →</p>
    </Link>
  );
}
