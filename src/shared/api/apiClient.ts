import axios from 'axios';
import { leerEmpresaDePestana } from '../utils/empresaPestana';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // La empresa activa se manda por header en CADA petición, leída del
  // sessionStorage de esta pestaña. Así dos pestañas abiertas en empresas
  // distintas piden cada una sus propios datos, aunque compartan el token.
  // Si no hay valor (login), no se manda y el backend usa el de la sesión.
  const idEmpresa = leerEmpresaDePestana();
  if (idEmpresa) {
    config.headers['X-Empresa-Activa'] = String(idEmpresa);
  }

  return config;
});

/**
 * Clave donde se deja el motivo del corte para que LoginPage lo muestre.
 * sessionStorage (no localStorage): es un mensaje de UNA vez para ESTA
 * pestaña, no algo que deba sobrevivir ni contagiarse a las demás.
 */
export const CLAVE_MOTIVO_SALIDA = 'motivo_salida_sesion';

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    // Proveedor suspendido (documentación vencida sin regularizar): el
    // backend lo marca con esta bandera desde el middleware EmpresaActiva.
    // Se lo saca de la sesión y se lo manda al login con el motivo a la
    // vista -> si no, quedaba dentro del portal con TODAS las pantallas
    // tirando error 403 sin explicar nada.
    if (error.response?.status === 403 && error.response?.data?.proveedor_suspendido) {
      try {
        sessionStorage.setItem(
          CLAVE_MOTIVO_SALIDA,
          error.response.data.message ?? 'Tu acceso al portal está suspendido.'
        );
      } catch {
        // sessionStorage puede fallar en modos de privacidad restrictivos;
        // el login igual va a mostrar el motivo al reintentar entrar.
      }
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default apiClient;