/**
 * A dónde iba la persona cuando el portal la mandó a iniciar sesión
 * (14-nov-2026).
 *
 * El caso: el correo de "solicitud de arribo tardío" trae un enlace a
 * /calendario/aprobaciones. Si la sesión ya había vencido, el portal la
 * mandaba al login y después a /panel, y desde el celular nunca llegaba a
 * la pantalla para aprobar. Ahora, al entrar, vuelve a la página del enlace.
 *
 * sessionStorage: es de esta pestaña y se pierde al cerrarla, así que no
 * queda una ruta vieja esperando al próximo que inicie sesión en otro lado.
 * Sin dependencias, porque lo importa apiClient (mismo criterio que
 * empresaPestana).
 */
const CLAVE = 'ruta_pendiente_login';

/** Solo rutas internas del portal: nada de "//otro-sitio" ni volver al login. */
function esRutaValida(ruta: string): boolean {
  return (
    ruta.startsWith('/') &&
    !ruta.startsWith('//') &&
    !ruta.startsWith('/login') &&
    ruta !== '/' &&
    ruta !== '/panel'
  );
}

export function guardarRutaPendiente(ruta: string): void {
  if (!esRutaValida(ruta)) return;
  try {
    sessionStorage.setItem(CLAVE, ruta);
  } catch {
    // Sin sessionStorage se entra al inicio, como antes.
  }
}

/** Devuelve la ruta guardada (una sola vez) o null. */
export function tomarRutaPendiente(): string | null {
  try {
    const ruta = sessionStorage.getItem(CLAVE);
    sessionStorage.removeItem(CLAVE);
    return ruta && esRutaValida(ruta) ? ruta : null;
  } catch {
    return null;
  }
}
