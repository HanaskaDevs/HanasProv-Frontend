import { useLocation } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { useAndroidBackButton } from './shared/hooks/useAndroidBackButton';
import { useModoNavideno } from './shared/hooks/useModoNavideno';
import Nevada from './shared/components/navidad/Nevada';

function App() {
  // Tiene que vivir ACÁ (dentro de BrowserRouter, ver main.tsx) y no en
  // AppRoutes: useAndroidBackButton usa useLocation/useNavigate, que
  // necesitan estar dentro del Router pero fuera de las <Routes> que
  // cambian con cada navegación (si viviera dentro de una ruta puntual,
  // se desmontaría/remontaría con cada cambio de pantalla).
  useAndroidBackButton();

  // Modo navideño (04-nov-2026): la nieve va acá para cubrir TODO el portal,
  // también el login y la portada. Menos en el Modo TV del calendario: esa
  // pantalla se mira de lejos en recepción y tiene que leerse limpia.
  const navidad = useModoNavideno();
  const { pathname } = useLocation();
  const conNieve = navidad && !pathname.startsWith('/calendario/modo-tv');

  return (
    <>
      <AppRoutes />
      {conNieve && <Nevada />}
    </>
  );
}

export default App;
