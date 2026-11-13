import { lazy, type ComponentType } from 'react';

/**
 * `lazy()` que sobrevive a un despliegue con la pestaña abierta.
 *
 * EL PROBLEMA (visto en producción el 12-nov-2026, con cuatro despliegues
 * en un día): cada página vive en su propio chunk con el hash del
 * contenido en el nombre (`AuditoriasPage-DjN4_yJf.js`). Cuando se cambia
 * el `dist`, esos archivos pasan a llamarse distinto. Quien tenía el
 * portal abierto sigue con el `index` viejo en memoria, así que al entrar
 * a una sección pide un chunk que ya no existe y el navegador contesta
 * 404:
 *
 *   Failed to load resource: 404 (assets/AuditoriasPage-DjN4_yJf.js)
 *   Uncaught TypeError: Failed to fetch dynamically imported module
 *
 * La pantalla se queda en blanco y la persona no tiene forma de saber que
 * lo único que hace falta es recargar.
 *
 * QUÉ HACE ESTO: si la carga del chunk falla, recarga la página una sola
 * vez. Al volver, el navegador pide el `index` nuevo y todo sigue.
 *
 * LA MARCA EN sessionStorage ES LO QUE EVITA UN BUCLE: si tras recargar
 * vuelve a fallar -porque el problema no era el despliegue sino la red o
 * el servidor-, ya no se recarga de nuevo; se deja subir el error para
 * que lo trate quien corresponda, en vez de dejar la pestaña recargándose
 * para siempre. La marca se borra en cuanto un chunk carga bien.
 *
 * Es `sessionStorage` y no `localStorage` a propósito: la marca vale para
 * ESTA pestaña y no tiene por qué sobrevivir a cerrarla.
 *
 * LA MARCA CADUCA (13-nov-2026). Antes no caducaba: si tras recargar la
 * persona caía en el login o la landing (que no son lazy), ningún chunk
 * "cargaba bien", la marca quedaba puesta para siempre en esa pestaña, y
 * en el SIGUIENTE despliegue ya no se recargaba y la pantalla quedaba en
 * blanco (visto en producción el 13-nov con PedidosPage). Un bucle real
 * ocurre en segundos; una marca de hace más de SEGUNDOS_VIGENCIA_MARCA es
 * de otro despliegue y no debe impedir la recarga.
 */
const CLAVE_RECARGA = 'portal:recarga-por-chunk-viejo';
const SEGUNDOS_VIGENCIA_MARCA = 30;

function marcarIntento(): boolean {
  try {
    const marca = Number(sessionStorage.getItem(CLAVE_RECARGA) ?? 0);
    if (marca && Date.now() - marca < SEGUNDOS_VIGENCIA_MARCA * 1000) return false;
    sessionStorage.setItem(CLAVE_RECARGA, String(Date.now()));
    return true;
  } catch {
    // Modo privado o almacenamiento bloqueado: sin marca no se puede
    // garantizar que no haya bucle, así que no se recarga.
    return false;
  }
}

function limpiarIntento(): void {
  try {
    sessionStorage.removeItem(CLAVE_RECARGA);
  } catch {
    // Da igual: solo era una marca.
  }
}

export function lazyPagina<T extends ComponentType<unknown>>(
  importar: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      const modulo = await importar();
      limpiarIntento();
      return modulo;
    } catch (error) {
      if (marcarIntento()) {
        window.location.reload();
        // Promesa que nunca resuelve: la página ya se está recargando, y
        // así React no alcanza a pintar el error antes de que ocurra.
        return new Promise<{ default: T }>(() => {});
      }

      throw error;
    }
  });
}
