// src/modules/auth/components/PanelSistemas.tsx
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import Spinner from '../../../shared/components/Spinner';
import { obtenerResumenDashboard } from '../api/dashboardSistemasApi';

function IconoEmpresa({ className = '' }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="4" y="2" width="16" height="20" rx="1" />
      <path d="M9 22v-4h6v4M9 6h.01M9 10h.01M9 14h.01M15 6h.01M15 10h.01M15 14h.01" />
    </svg>
  );
}

function IconoFicha({ className = '' }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M9 12h6M9 16h6" />
    </svg>
  );
}

function IconoCarpeta({ className = '' }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </svg>
  );
}

function IconoProductos({ className = '' }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 12h18" />
    </svg>
  );
}

function IconoReclamo({ className = '' }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
    </svg>
  );
}

function IconoPedido({ className = '' }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function formatearFecha(fecha: string | null): string {
  if (!fecha) return '—';
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
}

const COLOR_ESTADO: Record<string, string> = {
  Aspirante: 'bg-amber-50 text-amber-700',
  Aprobado: 'bg-emerald-50 text-emerald-700',
  Rechazado: 'bg-brand-wine/10 text-brand-wine',
  Suspendido: 'bg-brand-900/8 text-brand-900/50',
};

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

/**
 * Panel de Inicio para Sistemas/Admin -> antes esta pantalla solo tenía
 * un cartel genérico ("usa el menú lateral..."). Todo lo que se ve acá
 * está acotado a la empresa activa (mismo selector del header), igual
 * que el resto de las pantallas de administración.
 */
export default function PanelSistemas() {
  // Este panel lo ven Sistemas Y Admin, y no todas las tarjetas aplican a
  // los dos: la de Empresas enlaza a /empresas, que es solo de Sistemas.
  // Mostrársela al Admin lo mandaba a una pantalla que el backend le niega.
  const { esSistemas } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-sistemas'],
    queryFn: obtenerResumenDashboard,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  const proveedoresPorEstado = data?.proveedores_por_estado ?? {};
  const totalProveedores = Object.values(proveedoresPorEstado).reduce((acc, n) => acc + n, 0);

  return (
    <div className="space-y-5">
      <div className={`grid gap-3 grid-cols-2 ${esSistemas ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
        {esSistemas && (
          <TarjetaStat
            icono={<IconoEmpresa />}
            valor={data?.total_empresas ?? 0}
            etiqueta="Empresas activas"
            color="text-brand-700 bg-brand-700/10"
            to="/empresas"
          />
        )}
        <TarjetaStat
          icono={<IconoFicha />}
          valor={data?.fichas_pendientes ?? 0}
          etiqueta="Fichas por calificar"
          color={
            (data?.fichas_pendientes ?? 0) > 0 ? 'text-amber-700 bg-amber-50' : 'text-brand-900/40 bg-brand-900/5'
          }
          to="/proveedores"
        />
        <TarjetaStat
          icono={<IconoCarpeta />}
          valor={data?.documentos_pendientes ?? 0}
          etiqueta="Documentos por calificar"
          color={
            (data?.documentos_pendientes ?? 0) > 0 ? 'text-amber-700 bg-amber-50' : 'text-brand-900/40 bg-brand-900/5'
          }
          to="/proveedores"
        />
        <TarjetaStat
          icono={<IconoProductos />}
          valor={data?.productos_pendientes ?? 0}
          etiqueta="Productos por calificar"
          color={
            (data?.productos_pendientes ?? 0) > 0 ? 'text-amber-700 bg-amber-50' : 'text-brand-900/40 bg-brand-900/5'
          }
          to="/proveedores"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-lg border border-brand-900/8 bg-white p-4">
          <p className="text-sm font-semibold text-brand-900 mb-3">Proveedores por estado</p>
          {totalProveedores === 0 ? (
            <p className="text-xs text-brand-900/50">Todavía no hay proveedores registrados en esta empresa.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(proveedoresPorEstado).map(([estado, total]) => (
                <div key={estado} className="flex items-center justify-between text-sm">
                  <span
                    className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                      COLOR_ESTADO[estado] ?? 'bg-brand-900/8 text-brand-900/60'
                    }`}
                  >
                    {estado}
                  </span>
                  <span className="text-brand-900 font-medium">{total}</span>
                </div>
              ))}
            </div>
          )}
          <Link to="/proveedores" className="inline-block mt-3 text-xs font-medium text-brand-700 hover:underline">
            Ver Calificación de Proveedores →
          </Link>
        </div>

        <TarjetaStat
          icono={<IconoReclamo />}
          valor={data?.reclamos_abiertos ?? 0}
          etiqueta="Reclamos abiertos"
          color={
            (data?.reclamos_abiertos ?? 0) > 0 ? 'text-brand-wine bg-brand-wine/10' : 'text-brand-900/40 bg-brand-900/5'
          }
          to="/reclamos/abiertos"
        />
      </div>

      <div className="rounded-lg border border-brand-900/8 bg-white p-4">
        <div className="flex items-center gap-2 mb-3">
          <IconoPedido className="text-brand-900/40" />
          <p className="text-sm font-semibold text-brand-900">Pedidos próximos a recibir</p>
        </div>

        {(data?.pedidos_proximos ?? []).length === 0 ? (
          <p className="text-xs text-brand-900/50">No hay pedidos abiertos en esta empresa por el momento.</p>
        ) : (
          <div className="divide-y divide-brand-900/6">
            {(data?.pedidos_proximos ?? []).map((pedido) => (
              <div key={pedido.nro_pedido} className="flex items-center justify-between py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-brand-900 truncate">Pedido #{pedido.nro_pedido}</p>
                  <p className="text-xs text-brand-900/50 truncate">{pedido.proveedor ?? 'Proveedor sin nombre'}</p>
                </div>
                <span
                  className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-md ${
                    pedido.vencido ? 'bg-brand-wine/10 text-brand-wine' : 'bg-brand-900/5 text-brand-900/60'
                  }`}
                >
                  {pedido.vencido ? 'Vencido' : 'Esperado'} {formatearFecha(pedido.fecha_recepcion_esperada)}
                </span>
              </div>
            ))}
          </div>
        )}

        <Link to="/pedidos" className="inline-block mt-3 text-xs font-medium text-brand-700 hover:underline">
          Ver todos los Pedidos →
        </Link>
      </div>
    </div>
  );
}