import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../modules/auth/hooks/useAuth';
import DashboardLayout from '../shared/layouts/DashboardLayout';
import Spinner from '../shared/components/Spinner';
import { useInactividad } from '../shared/hooks/useInactividad';

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  useInactividad(15, async () => {
    await logout();
    navigate('/login');
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-8 w-8" />
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