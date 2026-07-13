import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../modules/auth/hooks/useAuth';
import DashboardLayout from '../shared/layouts/DashboardLayout';
import Logo from '../shared/components/Logo';
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
    return (
      <div className="min-h-screen bg-brand-900 flex flex-col items-center justify-center gap-6">
        <Logo className="h-14" variant="light" />
        {/* Spinner inline (no el <Spinner/> compartido): ese usa colores
            oscuros fijos pensados para fondos claros -> aquí, sobre fondo
            brand-900, quedaba prácticamente invisible. */}
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}