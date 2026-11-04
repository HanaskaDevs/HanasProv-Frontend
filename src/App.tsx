import { useLocation } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { useAndroidBackButton } from './shared/hooks/useAndroidBackButton';
import { useModoNavideno } from './shared/hooks/useModoNavideno';
import { useAuth } from './modules/auth/hooks/useAuth';
import Nevada from './shared/components/navidad/Nevada';

function App() {
  // Tiene que vivir ACÁ (dentro de BrowserRouter, ver main.tsx) y no en
  // AppRoutes: useAndroidBackButton usa useLocation/useNavigate, que
  // necesitan estar dentro del Router pero fuera de las <Routes> que
  // cambian con cada navegación (si viviera dentro de una ruta puntual,
  // se desmontaría/remontaría con cada cambio de pantalla).
  useAndroidBackButton();

  // Modo navideño: nieve en TODA la pantalla solo sin sesión (login, portada,
  // activar cuenta...). Ya dentro del portal cae solo sobre la barra azul
  // (04-nov-2026, pedido del usuario; ver DashboardLayout). Nunca en el Modo
  // TV: se mira de lejos en recepción y tiene que leerse limpio.
  const navidad = useModoNavideno();
  const { isAuthenticated } = useAuth();
  const { pathname } = useLocation();
  const conNieve = navidad && !isAuthenticated && !pathname.startsWith('/calendario/modo-tv');

  return (
    <>
      <AppRoutes />
      {conNieve && <Nevada />}
    </>
  );
}

export default App;
