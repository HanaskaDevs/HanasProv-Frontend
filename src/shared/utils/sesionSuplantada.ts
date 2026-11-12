/**
 * "Entrar como este usuario" (12-nov-2026): Sistemas usa un token de un
 * proveedor o de un usuario interno SOLO en esta pestaña.
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
const CLAVE_RUTA = 'ruta_al_volver_suplantacion';

export function leerTokenSuplantacion(): string | null {
  try {
    return sessionStorage.getItem(CLAVE);
  } catch {
    return null;
  }
}

export function guardarTokenSuplantacion(token: string, rutaAlVolver: string): void {
  try {
    sessionStorage.setItem(CLAVE, token);
    sessionStorage.setItem(CLAVE_RUTA, rutaAlVolver);
  } catch {
    // Sin sessionStorage no se puede entrar como proveedor sin pisar la
    // sesión propia: mejor que no pase nada.
  }
}

export function olvidarTokenSuplantacion(): void {
  try {
    sessionStorage.removeItem(CLAVE);
    sessionStorage.removeItem(CLAVE_RUTA);
  } catch {
    // nada que borrar
  }
}

/** El token que usa esta pestaña: el del proveedor si está "dentro" de uno, si no el propio. */
export function tokenDeEstaPestana(): string | null {
  return leerTokenSuplantacion() ?? localStorage.getItem('token');
}

/** La lista de la que salió Sistemas (proveedores o internos); se lee ANTES de olvidar el token. */
export function rutaAlVolver(): string {
  try {
    return sessionStorage.getItem(CLAVE_RUTA) ?? '/usuarios/proveedores';
  } catch {
    return '/usuarios/proveedores';
  }
}
