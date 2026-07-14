import { useAuth } from '../hooks/useAuth';
import Card from '../../../shared/components/Card';
import PanelProveedor from '../components/PanelProveedor';

export default function DashboardHomePage() {
  const { usuario, empresaActiva, esProveedor } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-brand-900">
          Hola, {usuario?.nombre_completo}
        </h1>
        <p className="text-brand-900/60 text-sm mt-1">
          {empresaActiva?.razon_social ?? 'Sin empresa activa'} · Rol: {empresaActiva?.nombre_rol ?? '—'}
        </p>
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