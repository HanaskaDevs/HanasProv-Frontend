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

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;