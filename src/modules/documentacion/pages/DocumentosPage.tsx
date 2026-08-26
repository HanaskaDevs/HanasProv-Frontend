import ChecklistDocumentos from '../components/ChecklistDocumentos';
import RoleRoute from '../../../routes/RoleRoute';
import { useAuth } from '../../auth/hooks/useAuth';

function DocumentosPageContenido() {
  return (
    <div className="h-full flex flex-col space-y-3">
      <div className="max-w-6xl mx-auto w-full shrink-0">
        <h1 className="font-display text-lg font-semibold text-brand-900">Documentos</h1>
        <p className="text-brand-900/55 text-xs mt-0.5">Documentación legal, sanitaria y de calidad de tu empresa.</p>
      </div>
      <ChecklistDocumentos />
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
export default function DocumentosPage() {
  const { esProveedor } = useAuth();

  return (
    <RoleRoute allow={esProveedor}>
      <DocumentosPageContenido />
    </RoleRoute>
  );
}
