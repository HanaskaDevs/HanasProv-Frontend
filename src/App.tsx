import AppRoutes from './routes/AppRoutes';
import { useAndroidBackButton } from './shared/hooks/useAndroidBackButton';

function App() {
  // Tiene que vivir ACÁ (dentro de BrowserRouter, ver main.tsx) y no en
  // AppRoutes: useAndroidBackButton usa useLocation/useNavigate, que
  // necesitan estar dentro del Router pero fuera de las <Routes> que
  // cambian con cada navegación (si viviera dentro de una ruta puntual,
  // se desmontaría/remontaría con cada cambio de pantalla).
  useAndroidBackButton();

  return <AppRoutes />;
}

export default App;