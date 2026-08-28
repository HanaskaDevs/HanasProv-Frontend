import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import Card from '../../../shared/components/Card';
import PanelProveedor from '../components/PanelProveedor';
import PanelAspirante from '../components/PanelAspirante';
import PanelSistemas from '../components/PanelSistemas';
import PanelCalidad from '../components/PanelCalidad';
import * as fichaApi from '../../miFicha/api/fichaApi';

export default function DashboardHomePage() {
  const { usuario, empresaActiva, esProveedor, esSistemas, esAdmin, esCalidad, esGuardia } = useAuth();

  // El Guardia no tiene nada que hacer en el "inicio" genérico -> pedido
  // explícito del usuario: que entre directo a la pantalla donde marca
  // arribos. Esto cubre tanto el primer login (que siempre navega a
  // '/panel') como si llega aquí por un bookmark o el botón "atrás".
  if (esGuardia) {
    return <Navigate to="/calendario/seguimiento" replace />;
  }

  // Comparte queryKey con DashboardLayout/MiFichaPage -> React Query lo
  // sirve de caché en vez de duplicar la llamada. Mismo criterio
  // normalizado que en DashboardLayout (ver ese archivo para el porqué).
  const { data: ficha, isLoading: cargandoFicha } = useQuery({
    queryKey: ['mi-ficha'],
    queryFn: fichaApi.obtenerMiFicha,
    enabled: esProveedor,
    retry: false,
  });
  const esAspirante = esProveedor && (cargandoFicha || ficha?.estado?.trim().toLowerCase() === 'aspirante');

  function abrirGuia() {
    window.dispatchEvent(new Event('guia-inicio:abrir'));
  }

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6">
      <div className={`flex items-start flex-wrap gap-3 ${esAspirante ? 'justify-end' : 'justify-between'}`}>
        {!esAspirante && (
          <div>
            <h1 className="font-display text-2xl font-semibold text-brand-900">
              Bienvenido, {usuario?.nombre_completo}
            </h1>
            <p className="text-brand-900/60 text-sm mt-1">
              {empresaActiva?.razon_social ?? 'Sin empresa activa'}
            </p>
          </div>
        )}

        {esProveedor && (
          <button
            onClick={abrirGuia}
            className="flex items-center gap-2 text-sm font-medium px-3.5 py-2 rounded-md border border-brand-900/15 text-brand-900/70 hover:bg-brand-900/5 transition-colors shrink-0"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Ver guía de inicio
          </button>
        )}
      </div>

      {esProveedor ? (
        esAspirante ? <PanelAspirante /> : <PanelProveedor />
      ) : esSistemas || esAdmin ? (
        <PanelSistemas />
      ) : esCalidad ? (
        <PanelCalidad />
      ) : (
        <Card>
          <p className="text-sm text-brand-900/70">
            Portal de Proveedores — usa el menú lateral para navegar según tu rol.
          </p>
        </Card>
      )}
    </div>
  );
}