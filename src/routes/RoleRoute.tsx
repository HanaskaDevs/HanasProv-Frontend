import { type ReactNode } from 'react';
import Card from '../shared/components/Card';

/**
 * Envuelve una página que requiere un rol específico. A diferencia de
 * ProtectedRoute (que solo exige sesión), aquí mostramos un mensaje claro
 * de "no autorizado" en vez de redirigir silenciosamente -> el backend
 * de todas formas vuelve a validar esto en cada request, esto es solo UX.
 */
export default function RoleRoute({ allow, children }: { allow: boolean; children: ReactNode }) {
  if (!allow) {
    return (
      <Card className="max-w-md">
        <h2 className="font-display text-lg font-semibold text-brand-900 mb-2">Acceso no disponible</h2>
        <p className="text-sm text-brand-900/60">
          Tu rol actual no tiene permiso para ver esta sección.
        </p>
      </Card>
    );
  }

  return <>{children}</>;
}
