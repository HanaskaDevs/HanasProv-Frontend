// src/shared/utils/empresaPestana.ts

/**
 * Empresa activa de ESTA pestaña.
 *
 * Vive en sessionStorage, que es por pestaña (a diferencia de localStorage, que
 * se comparte entre todas): es lo que permite tener la empresa 1 abierta en una
 * pestaña y la 2 en otra usando el mismo token.
 *
 * Sesion.Id_Empresa_Activa en el servidor se sigue actualizando, pero pasa a ser
 * sólo el valor por defecto para una pestaña nueva que todavía no eligió. Antes
 * era la única fuente de verdad, y por eso al volver a una pestaña el refresco
 * de datos la arrastraba a la empresa que había elegido la otra.
 *
 * ¡OJO! Este archivo NO debe importar nada del proyecto.
 *
 * Lo consumen apiClient.ts y useAuth.tsx. Si viviera dentro de useAuth, se
 * formaría un ciclo (apiClient -> useAuth -> authApi -> apiClient) y la función
 * llegaría como `undefined` al interceptor en tiempo de ejecución, haciendo
 * fallar TODAS las peticiones al API. Ya pasó: mantenerlo aislado es lo que lo
 * evita.
 */

const CLAVE = 'empresa_activa_pestana';

export function leerEmpresaDePestana(): number | null {
  try {
    const valor = Number(sessionStorage.getItem(CLAVE));
    return Number.isInteger(valor) && valor > 0 ? valor : null;
  } catch {
    // sessionStorage puede lanzar en modos de privacidad muy restrictivos.
    // Devolver null hace que se use la empresa de la sesión del servidor.
    return null;
  }
}

export function guardarEmpresaDePestana(idEmpresa: number): void {
  try {
    sessionStorage.setItem(CLAVE, String(idEmpresa));
  } catch {
    // Sin sessionStorage se pierde el aislamiento por pestaña, pero la app
    // sigue funcionando con la empresa de la sesión.
  }
}

export function olvidarEmpresaDePestana(): void {
  try {
    sessionStorage.removeItem(CLAVE);
  } catch {
    // nada que hacer
  }
}