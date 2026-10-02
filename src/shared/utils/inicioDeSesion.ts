/**
 * Identificador del último inicio de sesión de este navegador.
 *
 * POR QUÉ EXISTE: el banner informativo se puede configurar para que
 * aparezca "siempre que el usuario inicie sesión". El backend no puede
 * resolverlo solo —no distingue un token de un login nuevo del de una
 * pestaña recargada— y el componente tampoco: vive en el DashboardLayout,
 * así que una recarga, un cambio de empresa o volver de una página
 * pública lo montan de nuevo. Es el mismo problema que ya resolvió
 * saludoDeSesion para el saludo de Hana.
 *
 * VA EN localStorage Y NO EN sessionStorage, a diferencia de aquel. El
 * identificador tiene que ser el MISMO en todas las pestañas: con
 * sessionStorage, abrir una pestaña nueva parecería un login nuevo y el
 * banner volvería a salir sin que nadie haya vuelto a entrar. Lo que lo
 * cambia es exclusivamente pasar por login().
 */
const CLAVE = 'portal:id-inicio-sesion';

/** Marca un inicio de sesión nuevo. Lo llama login() en useAuth. */
export function marcarInicioDeSesion(): void {
  try {
    localStorage.setItem(CLAVE, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  } catch {
    // Sin almacenamiento, idDeSesionActual() devuelve null y lo que
    // dependa de esto se comporta como si cada visita fuera nueva.
  }
}

export function idDeSesionActual(): string | null {
  try {
    return localStorage.getItem(CLAVE);
  } catch {
    return null;
  }
}
