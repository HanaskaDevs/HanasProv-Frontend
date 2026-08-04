import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App.tsx';
import { AuthProvider } from './modules/auth/hooks/useAuth';
import 'leaflet/dist/leaflet.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Sin staleTime, React Query considera TODO viejo al instante: cada vez
      // que se monta un componente vuelve a pedir los mismos datos al servidor.
      // Con 30s, salir del panel y volver reutiliza lo que ya está en caché en
      // vez de repetir las 5 peticiones del panel del proveedor.
      staleTime: 30_000,

      // Los datos se conservan 5 min aunque nadie los esté usando -> volver a
      // una pantalla ya visitada la pinta al instante y refresca por detrás.
      gcTime: 5 * 60_000,

      // Apagado a propósito: useAuth ya refresca el usuario al volver a la
      // pestaña (visibilitychange). Con esto encendido se disparaban las dos
      // cosas a la vez y cada cambio de pestaña recargaba toda la pantalla.
      refetchOnWindowFocus: false,

      // Un solo reintento. El default (3, con espera creciente) hace que un
      // endpoint caído tarde varios segundos en avisar del error.
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);