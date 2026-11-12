/**
 * "Entrar como proveedor" (12-nov-2026): Sistemas usa un token del
 * proveedor SOLO en esta pestaña.
 *
 * El token propio de Sistemas sigue en localStorage, intacto; el del
 * proveedor va en sessionStorage, que es de esta pestaña. Así las otras
 * pestañas de Sistemas no cambian de cuenta, y "Volver a mi cuenta" solo
 * borra el del proveedor.
 *
 * En su propio módulo, sin dependencias, por lo mismo que empresaPestana:
 * apiClient lo importa, y si viviera en useAuth se formaría un ciclo.
 */
const CLAVE = 'token_suplantacion';

export function leerTokenSuplantacion(): string | null {
  try {
    return sessionStorage.getItem(CLAVE);
  } catch {
    return null;
  }
}

export function guardarTokenSuplantacion(token: string): void {
  try {
    sessionStorage.setItem(CLAVE, token);
  } catch {
    // Sin sessionStorage no se puede entrar como proveedor sin pisar la
    // sesión propia: mejor que no pase nada.
  }
}

export function olvidarTokenSuplantacion(): void {
  try {
    sessionStorage.removeItem(CLAVE);
  } catch {
    // nada que borrar
  }
}

/** El token que usa esta pestaña: el del proveedor si está "dentro" de uno, si no el propio. */
export function tokenDeEstaPestana(): string | null {
  return leerTokenSuplantacion() ?? localStorage.getItem('token');
}

/** A dónde vuelve Sistemas al salir de la cuenta del proveedor. */
export const RUTA_AL_VOLVER = '/usuarios/proveedores';
