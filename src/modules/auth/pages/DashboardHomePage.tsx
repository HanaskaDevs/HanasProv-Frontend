import { useAuth } from '../hooks/useAuth';
import Card from '../../../shared/components/Card';
import PanelProveedor from '../components/PanelProveedor';

export default function DashboardHomePage() {
  const { usuario, empresaActiva, esProveedor } = useAuth();

  function abrirGuia() {
    window.dispatchEvent(new Event('guia-inicio:abrir'));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-brand-900">
            Hola, {usuario?.nombre_completo}
          </h1>
          <p className="text-brand-900/60 text-sm mt-1">
            {empresaActiva?.razon_social ?? 'Sin empresa activa'} · Rol: {empresaActiva?.nombre_rol ?? '—'}
          </p>
        </div>

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
        <PanelProveedor />
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