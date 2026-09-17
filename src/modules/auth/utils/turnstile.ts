/**
 * Captcha invisible del login (Cloudflare Turnstile).
 *
 * CÓMO FUNCIONA EL "INVISIBLE": no es que no exista el widget, es que con
 * appearance 'interaction-only' no se dibuja nada mientras Cloudflare
 * considere normal el tráfico. Si algo le resulta sospechoso, ahí sí
 * muestra una casilla para tocar. Esa es justamente la diferencia con
 * reCAPTCHA v3, que en vez de preguntar le baja el puntaje a todo el que
 * salga por una IP compartida -que es el caso de toda la oficina-.
 *
 * FALLA HACIA ADELANTE. Si el script no carga (sin internet, un bloqueador,
 * la WebView de la app Android), obtenerTokenTurnstile() devuelve null y el
 * login se intenta igual. Quien decide qué hacer con un token ausente es el
 * backend (ver TurnstileService), que es el único lado donde esa decisión
 * no se puede manipular desde el navegador.
 *
 * REESCRITO EL 17-sep-2026 porque usuarios legítimos necesitaban 4 o 5
 * intentos para entrar. Había tres problemas que se sumaban:
 *
 *  1. El widget vivía en un div FUERA de la pantalla (fixed, z-index -1).
 *     Cuando Cloudflare decidía mostrar la casilla, nadie podía verla ni
 *     tocarla; el desafío expiraba y el login salía sin token -> 422.
 *     Ahora el widget se dibuja DENTRO del formulario de login (ver
 *     LoginPage): si hace falta interactuar, la casilla aparece a la vista.
 *  2. Se esperaba 8 s en total y después se seguía sin token. En una red
 *     lenta el desafío puede tardar más, y si Cloudflare pedía interacción
 *     la persona tenía 8 s para verla y tocarla. Ahora se esperan 15 s para
 *     el modo invisible y, si Cloudflare avisa que va a pedir interacción
 *     ('before-interactive-callback'), se extiende a 2 minutos.
 *  3. render() ejecutaba el desafío al instante y enseguida se llamaba
 *     execute() otra vez ("Call to execute() on a widget that is already
 *     executing" en la consola). Ahora el widget se dibuja al abrir la
 *     pantalla con execution 'execute' (sin correr nada) y se ejecuta UNA
 *     vez al pulsar Ingresar. Además, el script ya está cargado cuando la
 *     persona termina de escribir, así el primer intento no paga la carga.
 */

const URL_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

/** id del div, dentro del formulario de login, donde se dibuja el widget. */
export const ID_CONTENEDOR_TURNSTILE = 'contenedor-turnstile';

/** Espera máxima para el desafío invisible (sin nada que tocar), en ms. */
const ESPERA_INVISIBLE = 15000;

/** Espera máxima cuando Cloudflare muestra la casilla y hay que tocarla. */
const ESPERA_INTERACTIVA = 120000;

/** Cuánto tarda Turnstile en reintentar solo tras un error recuperable. */
const INTERVALO_REINTENTO = 2000;

interface ApiTurnstile {
  render: (contenedor: HTMLElement, opciones: Record<string, unknown>) => string | undefined;
  execute: (widget: string, opciones?: Record<string, unknown>) => void;
  reset: (widget: string) => void;
  remove: (widget: string) => void;
}

declare global {
  interface Window {
    turnstile?: ApiTurnstile;
  }
}

/** La site key es PÚBLICA: va en el bundle a propósito. La secret NUNCA. */
const SITE_KEY: string | undefined = import.meta.env.VITE_TURNSTILE_SITE_KEY;

let promesaScript: Promise<ApiTurnstile | null> | null = null;
let idWidget: string | null = null;

/**
 * El intento de login en curso. Los callbacks del widget se registran UNA
 * vez al dibujarlo, así que no pueden capturar el resolver de cada
 * promesa: miran acá quién está esperando el token en este momento.
 */
interface Intento {
  terminar: (token: string | null) => void;
  extender: () => void;
  alFallar: (codigo: string) => void;
  alVencer: () => void;
}

let intentoActual: Intento | null = null;

/**
 * Carga el script una sola vez para toda la sesión. La promesa se guarda
 * (y no un booleano) para que dos llamadas simultáneas esperen la misma
 * carga en vez de insertar dos etiquetas <script>.
 */
function cargarScript(): Promise<ApiTurnstile | null> {
  if (promesaScript) return promesaScript;

  promesaScript = new Promise((resolver) => {
    if (window.turnstile) {
      resolver(window.turnstile);
      return;
    }

    const script = document.createElement('script');
    script.src = URL_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = () => resolver(window.turnstile ?? null);
    // null y no un rechazo: que el captcha no cargue no es un error que
    // deba romper el login, es un caso previsto.
    script.onerror = () => resolver(null);

    document.head.appendChild(script);
  });

  return promesaScript;
}

/**
 * Códigos de error del widget que Cloudflare marca como "reintentar":
 * 3xxxxx (fallo al ejecutar el desafío en el navegador) y 6xxxxx (el
 * desafío no pasó). Los demás (1xxxxx: sitekey o dominio mal configurados,
 * navegador no soportado, etc.) no se arreglan reintentando.
 */
function esReintentable(codigo: string): boolean {
  return /^[36]/.test(codigo);
}

function opcionesWidget(): Record<string, unknown> {
  return {
    sitekey: SITE_KEY,
    action: 'login',
    // 'interaction-only': invisible salvo que Cloudflare necesite
    // preguntar algo.
    appearance: 'interaction-only',
    // 'execute': dibujar el widget NO corre el desafío; se corre una sola
    // vez, al pulsar Ingresar, con execute(). Así el token es de este
    // intento y no hay doble ejecución.
    execution: 'execute',
    // Ocupa el ancho del formulario si llega a mostrarse; oscuro porque el
    // login va sobre fondo oscuro.
    size: 'flexible',
    theme: 'dark',
    language: 'es',
    retry: 'auto',
    'retry-interval': INTERVALO_REINTENTO,
    callback: (token: string) => intentoActual?.terminar(token),
    'error-callback': (codigo?: string | number) => intentoActual?.alFallar(String(codigo ?? '')),
    'timeout-callback': () => intentoActual?.alVencer(),
    // Cloudflare avisa que va a mostrar la casilla: hay que darle tiempo a
    // la persona para verla y tocarla.
    'before-interactive-callback': () => intentoActual?.extender(),
  };
}

/**
 * Dibuja el widget (sin ejecutarlo) dentro del contenedor del formulario de
 * login. Se llama al abrir la pantalla, así el script ya está cargado
 * cuando la persona pulsa Ingresar. Devuelve el id del widget o null si no
 * se pudo (sin site key, script bloqueado, contenedor ausente).
 */
export async function prepararTurnstile(): Promise<string | null> {
  if (!SITE_KEY) return null;

  const api = await cargarScript();
  if (!api) return null;

  const contenedor = document.getElementById(ID_CONTENEDOR_TURNSTILE);
  if (!contenedor) return null;

  // Si quedó un widget de una visita anterior al login (se salió y se
  // volvió), su contenedor ya no está en la página: se descarta y se
  // dibuja uno nuevo en el actual.
  destruirTurnstile();

  try {
    idWidget = api.render(contenedor, opcionesWidget()) ?? null;
  } catch {
    idWidget = null;
  }

  return idWidget;
}

/** Al salir de la pantalla de login: libera el widget y cualquier espera. */
export function destruirTurnstile(): void {
  if (idWidget !== null) {
    try {
      window.turnstile?.remove(idWidget);
    } catch {
      // ya no existía; no importa
    }
  }
  idWidget = null;
  intentoActual = null;
}

/**
 * Devuelve un token nuevo para ESTE intento de login, o null si no se pudo
 * obtener (sin site key, script bloqueado, o el desafío no se completó a
 * tiempo).
 *
 * Se pide al ENVIAR y no al cargar la pantalla: los tokens duran unos pocos
 * minutos y son de un solo uso, así que uno pedido al abrir el formulario
 * llega vencido si la persona se demora en escribir.
 */
export async function obtenerTokenTurnstile(): Promise<string | null> {
  if (!SITE_KEY) return null;

  const api = await cargarScript();
  if (!api) return null;

  const widget = idWidget ?? (await prepararTurnstile());
  if (widget === null) return null;

  return new Promise<string | null>((resolver) => {
    let reloj = 0;
    let fallos = 0;

    const programarLimite = (ms: number) => {
      window.clearTimeout(reloj);
      reloj = window.setTimeout(() => terminar(null), ms);
    };

    const terminar = (token: string | null) => {
      window.clearTimeout(reloj);
      if (intentoActual === intento) intentoActual = null;
      resolver(token);
    };

    // Los tokens son de un solo uso: hay que resetear antes de pedir otro,
    // o Cloudflare devuelve el mismo y el backend lo rechaza por
    // "timeout-or-duplicate".
    const ejecutar = () => {
      try {
        api.reset(widget);
        api.execute(widget);
      } catch {
        terminar(null);
      }
    };

    const intento: Intento = {
      terminar,
      extender: () => programarLimite(ESPERA_INTERACTIVA),
      alFallar: (codigo) => {
        fallos += 1;
        // Un error recuperable lo reintenta Turnstile solo (retry 'auto');
        // se le da UNA oportunidad. Uno no recuperable, o el segundo
        // seguido, corta la espera para no dejar a la persona mirando el
        // botón girar hasta el límite.
        if (!esReintentable(codigo) || fallos >= 2) terminar(null);
      },
      // El desafío expiró sin resolverse (por ejemplo, la casilla quedó
      // sin tocar): se vuelve a ejecutar una vez.
      alVencer: () => {
        fallos += 1;
        if (fallos >= 2) terminar(null);
        else ejecutar();
      },
    };

    intentoActual = intento;
    programarLimite(ESPERA_INVISIBLE);
    ejecutar();
  });
}
