import ListaProductos from '../components/ListaProductos';
import RoleRoute from '../../../routes/RoleRoute';
import { useAuth } from '../../auth/hooks/useAuth';

function ProductosPageContenido() {
  return (
    <div className="space-y-3">
      <div className="max-w-6xl mx-auto w-full">
        <h1 className="font-display text-lg font-semibold text-brand-900">Productos</h1>
        <p className="text-brand-900/55 text-xs mt-0.5">Catálogo de productos con su ficha técnica y análisis.</p>
      </div>
      <ListaProductos />
    </div>
  );
}

/**
 * Pantalla EXCLUSIVA del usuario proveedor. El backend ya la niega a un
 * usuario interno (miProveedor() lanza AccessDenied si el Tipo_Usuario no es
 * Proveedor), así que no era un agujero de seguridad; el problema era de cara
 * al usuario: un interno que llegara por URL directa veía la pantalla
 * dibujada y cada consulta fallando por detrás, sin ningún mensaje que
 * explicara qué pasaba.
 */
export default function ProductosPage() {
  const { esProveedor } = useAuth();

  return (
    <RoleRoute allow={esProveedor}>
      <ProductosPageContenido />
    </RoleRoute>
  );
}
