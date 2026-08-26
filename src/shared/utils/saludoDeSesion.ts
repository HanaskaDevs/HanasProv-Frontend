/**
 * Bandera de "recién inició sesión", para el saludo proactivo de Hana.
 *
 * POR QUÉ EXISTE: el saludo configurado (el de Marcia, por ejemplo) se pidió
 * "solo cuando inicie sesión". El backend no puede decidirlo solo — no sabe si
 * el token que le llega es de un login nuevo o de una pestaña recargada — y el
 * componente tampoco: HanaBot vive en el DashboardLayout, así que basta una
 * recarga (F5), un cambio de empresa o entrar a una página pública y volver
 * para que se monte de nuevo y el saludo se repita. Eso es lo que se reportó
 * como que salía "a cada rato".
 *
 * Así que el momento del login se marca donde de verdad se conoce (useAuth) y
 * se consume una única vez donde se muestra (HanaBot).
 *
 * LEER Y CONSUMIR SON DOS FUNCIONES SEPARADAS, a propósito. Con React en
 * StrictMode cada efecto se monta, se limpia y se vuelve a montar; si el
 * montaje consumiera la bandera, el primero se la llevaba y el segundo —el que
 * de verdad queda vivo— no encontraba nada y el saludo no salía nunca en
 * desarrollo. Por eso HanaBot solo PREGUNTA al montarse, y recién la borra
 * cuando el backend ya le contestó. De paso, si la petición falla por red la
 * bandera queda puesta y el saludo se reintenta.
 *
 * sessionStorage y no localStorage: la bandera muere con la pestaña. Si el
 * navegador se cierra con la bandera puesta (login y cierre inmediato), no
 * queda un saludo pendiente esperando a la sesión siguiente.
 */
const CLAVE = 'hana:saludo-pendiente';

/** Marca que se acaba de iniciar sesión. Lo llama login() en useAuth. */
export function marcarSaludoPendiente(): void {
    try {
        sessionStorage.setItem(CLAVE, '1');
    } catch {
        // Modo privado o almacenamiento bloqueado: sin bandera no hay saludo
        // proactivo, y es la degradación correcta (mejor que salga de menos
        // que de más).
    }
}

/** ¿Corresponde saludar? Solo consulta, no consume. */
export function haySaludoPendiente(): boolean {
    try {
        return sessionStorage.getItem(CLAVE) !== null;
    } catch {
        return false;
    }
}

/**
 * Da el saludo por entregado. Se llama cuando el backend ya contestó (haya
 * mandado saludo o no) y también al cerrar sesión, por si quedó sin consumir.
 */
export function olvidarSaludoPendiente(): void {
    try {
        sessionStorage.removeItem(CLAVE);
    } catch {
        // Nada que limpiar si el almacenamiento no está disponible.
    }
}
