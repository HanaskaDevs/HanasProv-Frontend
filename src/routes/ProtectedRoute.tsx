import { Suspense } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../modules/auth/hooks/useAuth';
import DashboardLayout from '../shared/layouts/DashboardLayout';
import PantallaCarga from '../shared/components/PantallaCarga';
import Spinner from '../shared/components/Spinner';
import { useInactividad } from '../shared/hooks/useInactividad';

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  // Control de inactividad (15 minutos)
  useInactividad(15, async () => {
    await logout();
    navigate('/login');
  });

  if (isLoading) {
    return <PantallaCarga />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <DashboardLayout>
      {/* El Suspense va ACÁ ADENTRO, no envolviendo al DashboardLayout:
          las páginas se cargan por separado (ver AppRoutes), y si la
          espera reemplazara el layout entero, el header y el menú
          desaparecerían un instante en cada cambio de sección. Así solo
          el área de contenido muestra el spinner, igual que ya hace
          cualquier página mientras espera sus datos. */}
      <Suspense
        fallback={
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        }
      >
        <Outlet />
      </Suspense>
    </DashboardLayout>
  );
}
