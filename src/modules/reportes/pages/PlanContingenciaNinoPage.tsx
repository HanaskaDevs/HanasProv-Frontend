import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/hooks/useAuth';
import RoleRoute from '../../../routes/RoleRoute';
import Card from '../../../shared/components/Card';
import Spinner from '../../../shared/components/Spinner';
import BarraBusqueda from '../../../shared/components/BarraBusqueda';
import ModalVisorPdf from '../../proveedores/components/ModalVisorPdf';
import { obtenerUrlVisorDocumento } from '../../proveedores/api/proveedoresApi';
import { obtenerPlanContingenciaNino, type ProveedorPlanContingencia } from '../api/reportesApi';
import { nombreVisibleProveedor } from '../../proveedores/types';

const COLOR_ESTADO: Record<string, string> = {
  Aspirante: 'bg-amber-50 text-amber-700',
  Aprobado: 'bg-emerald-50 text-emerald-700',
  Rechazado: 'bg-brand-wine/10 text-brand-wine',
  Suspendido: 'bg-brand-900/8 text-brand-900/50',
};

function formatearFecha(iso: string | null | undefined): string {
  if (!iso) return '—';
  const fecha = new Date(iso);
  if (isNaN(fecha.getTime())) return '—';
  return fecha.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
}

type Pestana = 'con' | 'sin';

/**
 * Seguimiento del Plan de contingencia contra el fenómeno del Niño: quién
 * lo cargó (con el documento a un clic) y a quién todavía le falta, para
 * poder perseguirlo. Se llega desde la tarjeta del panel de inicio.
 */
function PlanContingenciaNinoContent() {
  const [pestana, setPestana] = useState<Pestana>('con');
  const [busqueda, setBusqueda] = useState('');
  const [enVisor, setEnVisor] = useState<ProveedorPlanContingencia | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['plan-contingencia-nino'],
    queryFn: obtenerPlanContingenciaNino,
  });

  const filas = useMemo(() => {
    const lista = (pestana === 'con' ? data?.con_plan : data?.sin_plan) ?? [];
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return lista;
    return lista.filter(
      (p) =>
        p.razon_social.toLowerCase().includes(texto) ||
        (p.nombre_comercial ?? '').toLowerCase().includes(texto) ||
        (p.ruc ?? '').includes(texto)
    );
  }, [data, pestana, busqueda]);

  const total = data?.total_proveedores ?? 0;
  const cargaron = data?.cargaron ?? 0;

  return (
    <div className="max-w-6xl mx-auto w-full space-y-4">
      <div>
        <h1 className="font-display text-xl font-semibold text-brand-900">Plan de contingencia · Fenómeno del Niño</h1>
        <p className="text-brand-900/50 text-xs mt-0.5">
          Documento opcional e informativo: no se califica. {total > 0 && `${cargaron} de ${total} proveedores ya lo cargaron.`}
        </p>
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-900/8 px-4 pt-3 pb-3">
          <div className="flex gap-1" role="tablist">
            {(
              [
                ['con', `Lo cargaron (${data?.con_plan.length ?? 0})`],
                ['sin', `Les falta (${data?.sin_plan.length ?? 0})`],
              ] as const
            ).map(([clave, etiqueta]) => (
              <button
                key={clave}
                role="tab"
                aria-selected={pestana === clave}
                onClick={() => setPestana(clave)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  pestana === clave ? 'bg-brand-900 text-white' : 'text-brand-900/60 hover:bg-brand-200/40'
                }`}
              >
                {etiqueta}
              </button>
            ))}
          </div>
          <BarraBusqueda valor={busqueda} onCambiar={setBusqueda} placeholder="Buscar proveedor o RUC..." />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="h-6 w-6" />
          </div>
        ) : isError ? (
          <p className="px-4 py-8 text-center text-sm text-brand-wine">No se pudo cargar el seguimiento. Intenta de nuevo.</p>
        ) : filas.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-brand-900/50">
            {busqueda
              ? 'Ningún proveedor coincide con la búsqueda.'
              : pestana === 'con'
                ? 'Todavía ningún proveedor cargó su plan.'
                : 'Todos los proveedores ya cargaron su plan.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-brand-200/30 text-left text-brand-900/70">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Proveedor</th>
                  <th className="hidden md:table-cell px-4 py-2.5 font-medium">Correo</th>
                  <th className="hidden sm:table-cell px-4 py-2.5 font-medium">Estado</th>
                  {pestana === 'con' && <th className="hidden sm:table-cell px-4 py-2.5 font-medium">Cargado el</th>}
                  {pestana === 'con' && <th className="px-4 py-2.5 font-medium text-right">Documento</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-900/8">
                {filas.map((p) => (
                  <tr key={p.id_proveedor}>
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-brand-900">{nombreVisibleProveedor(p)}</p>
                      <p className="text-[12px] text-brand-900/50">{p.ruc ?? 'Sin RUC'}</p>
                    </td>
                    <td className="hidden md:table-cell px-4 py-2.5 text-brand-900/70">{p.email ?? '—'}</td>
                    <td className="hidden sm:table-cell px-4 py-2.5">
                      {p.estado && (
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${COLOR_ESTADO[p.estado] ?? 'bg-brand-900/8 text-brand-900/60'}`}>
                          {p.estado}
                        </span>
                      )}
                    </td>
                    {pestana === 'con' && (
                      <td className="hidden sm:table-cell px-4 py-2.5 whitespace-nowrap text-brand-900/70">
                        {formatearFecha(p.fecha_carga)}
                      </td>
                    )}
                    {pestana === 'con' && (
                      <td className="px-4 py-2.5 text-right">
                        <button
                          onClick={() => setEnVisor(p)}
                          className="rounded-md bg-brand-700/8 px-2 py-1 text-[12px] font-medium text-brand-700 hover:bg-brand-700/15"
                        >
                          Ver
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {enVisor?.id_documento_proveedor && (
        <ModalVisorPdf
          idDocumento={enVisor.id_documento_proveedor}
          nombre={`Plan de contingencia - ${nombreVisibleProveedor(enVisor)}`}
          obtenerUrl={obtenerUrlVisorDocumento}
          onClose={() => setEnVisor(null)}
        />
      )}
    </div>
  );
}

export default function PlanContingenciaNinoPage() {
  const { esSistemas, esAdmin, esCalidad } = useAuth();

  return (
    <RoleRoute allow={esSistemas || esAdmin || esCalidad}>
      <PlanContingenciaNinoContent />
    </RoleRoute>
  );
}
