import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import * as horariosEntregaApi from '../api/horariosEntregaApi';

/**
 * Solicitudes de arribo tardío por aprobar, en el Inicio (14-nov-2026).
 *
 * Para quien las resuelve (portal.email_aprobacion_arribo) y para Sistemas.
 * En el celular el ítem del menú queda escondido detrás de la hamburguesa;
 * acá se ve apenas se entra, con un botón directo a la bandeja. Comparte
 * queryKey con AprobacionesArriboPage, así que al aprobar se actualiza sola.
 */
export default function TarjetaAprobacionesPendientes() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['horarios-entrega-aprobaciones'],
    queryFn: horariosEntregaApi.listarSolicitudesAprobacion,
    refetchInterval: 60_000,
    retry: false,
  });

  if (isLoading || isError || !data) return null;

  const pendientes = data.length;

  if (pendientes === 0) {
    return (
      <div className="rounded-lg border border-brand-900/10 bg-white px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-brand-900/70">No hay solicitudes de arribo tardío por aprobar.</p>
        <Link to="/calendario/aprobaciones" className="text-xs font-medium text-brand-700 hover:underline">
          Ver aprobaciones de arribo
        </Link>
      </div>
    );
  }

  const nombres = data
    .slice(0, 3)
    .map((s) => s.nombre_proveedor ?? 'Proveedor')
    .join(', ');

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3.5 flex flex-wrap items-center gap-x-4 gap-y-3">
      <div className="flex-1 min-w-[14rem]">
        <p className="text-sm font-semibold text-brand-900">
          {pendientes === 1
            ? 'Tienes 1 solicitud de arribo tardío por aprobar'
            : `Tienes ${pendientes} solicitudes de arribo tardío por aprobar`}
        </p>
        <p className="text-xs text-brand-900/65 mt-0.5">
          {nombres}
          {pendientes > 3 ? ` y ${pendientes - 3} más` : ''}.
        </p>
      </div>
      <Link
        to="/calendario/aprobaciones"
        className="w-full sm:w-auto text-center min-h-11 sm:min-h-0 inline-flex items-center justify-center rounded-md bg-brand-900 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        Revisar y aprobar
      </Link>
    </div>
  );
}
