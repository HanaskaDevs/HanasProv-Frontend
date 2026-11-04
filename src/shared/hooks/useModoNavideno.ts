import { useQuery } from '@tanstack/react-query';
import { obtenerModoNavideno } from '../api/publicConfigApi';

/** Clave compartida: el interruptor de Configuraciones la actualiza al cambiar. */
export const CLAVE_MODO_NAVIDENO = ['modo-navideno'] as const;

/**
 * ¿Está encendido el modo navideño? (04-nov-2026)
 *
 * Se pregunta sin sesión porque también decora el login. Cambia muy de vez en
 * cuando (una vez al año), así que se cachea 10 minutos: no hace falta volver a
 * pedirlo en cada pantalla. Si la consulta falla, el portal se ve normal: la
 * decoración nunca debe romper nada.
 */
export function useModoNavideno(): boolean {
  const { data } = useQuery({
    queryKey: CLAVE_MODO_NAVIDENO,
    queryFn: obtenerModoNavideno,
    staleTime: 10 * 60_000,
    retry: false,
  });

  return data === true || forzadoEnDesarrollo();
}

/**
 * SOLO EN DESARROLLO (npm run dev): `localStorage.setItem('modoNavidenoForzado', '1')`
 * muestra la decoración sin tocar la configuración de la base, para revisar el
 * diseño en local. En el build de producción `import.meta.env.DEV` es false y
 * Vite elimina esta rama entera.
 */
function forzadoEnDesarrollo(): boolean {
  if (!import.meta.env.DEV) return false;
  try {
    return window.localStorage.getItem('modoNavidenoForzado') === '1';
  } catch {
    return false;
  }
}

/**
 * true si el sistema pidió menos animación (accesibilidad). Con esto la nieve
 * no se dibuja y el gorro y las luces quedan quietos.
 */
export function prefiereMenosMovimiento(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}
