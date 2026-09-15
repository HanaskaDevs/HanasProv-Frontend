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
 */

const URL_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const ID_CONTENEDOR = 'contenedor-turnstile';

/** Cuánto se espera al desafío antes de seguir sin token, en ms. */
const ESPERA_MAXIMA = 8000;

interface ApiTurnstile {
  render: (contenedor: HTMLElement, opciones: Record<string, unknown>) => string;
  execute: (widget: string, opciones?: Record<string, unknown>) => void;
  reset: (widget: string) => void;
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

/** El div donde vive el widget. Se crea una vez y se reusa. */
function obtenerContenedor(): HTMLElement {
  const existente = document.getElementById(ID_CONTENEDOR);
  if (existente) return existente;

  const contenedor = document.createElement('div');
  contenedor.id = ID_CONTENEDOR;
  // Fuera del flujo pero NO con display:none: un widget oculto del todo
  // Cloudflare no lo ejecuta. Si llega a hacer falta mostrar el desafío,
  // el propio script lo trae al frente en un modal.
  contenedor.style.position = 'fixed';
  contenedor.style.bottom = '0';
  contenedor.style.left = '0';
  contenedor.style.zIndex = '-1';
  document.body.appendChild(contenedor);

  return contenedor;
}

/**
 * Devuelve un token nuevo para ESTE intento de login, o null si no se pudo
 * obtener (sin site key, script bloqueado, o el desafío tardó demasiado).
 *
 * Se pide al ENVIAR y no al cargar la pantalla: los tokens duran unos pocos
 * minutos y son de un solo uso, así que uno pedido al abrir el formulario
 * llega vencido si la persona se demora en escribir.
 */
export async function obtenerTokenTurnstile(): Promise<string | null> {
  if (!SITE_KEY) return null;

  const api = await cargarScript();
  if (!api) return null;

  try {
    return await new Promise<string | null>((resolver) => {
      // Si el desafío se traba, no se deja el login colgado para siempre.
      const reloj = window.setTimeout(() => resolver(null), ESPERA_MAXIMA);

      const terminar = (token: string | null) => {
        window.clearTimeout(reloj);
        resolver(token);
      };

      if (idWidget === null) {
        idWidget = api.render(obtenerContenedor(), {
          sitekey: SITE_KEY,
          action: 'login',
          // 'interaction-only': invisible salvo que Cloudflare necesite
          // preguntar algo.
          appearance: 'interaction-only',
          callback: (token: string) => terminar(token),
          'error-callback': () => terminar(null),
          'timeout-callback': () => terminar(null),
        });
      } else {
        // Los tokens son de un solo uso: hay que resetear antes de pedir
        // otro, o Cloudflare devuelve el mismo y el backend lo rechaza por
        // "timeout-or-duplicate".
        api.reset(idWidget);
      }

      api.execute(idWidget!, { action: 'login' });
    });
  } catch {
    return null;
  }
}
