import type { EstadoHorario } from './types';

/**
 * Anuncios por voz del Modo TV, estilo tablero de aeropuerto.
 *
 * Cada estado tiene SU PROPIA frase (pedido explícito del usuario): la
 * estructura es la misma para que se reconozca al vuelo, pero el verbo
 * cambia según lo que pasó -> "acaba de arribar" no puede sonar igual que
 * "ya entregó su pedido".
 *
 * "Programado" no anuncia nada a propósito: es el estado inicial de todas
 * las filas, no un cambio. Si cantara, cada mañana la bodega escucharía la
 * lista entera del día de una sola vez.
 */
export type ArmarMensaje = (proveedor: string, andenPuerta: string | null) => string;

export const MENSAJES_POR_ESTADO: Partial<Record<EstadoHorario, ArmarMensaje>> = {
  Arribo: (p) => `Proveedor ${p} acaba de arribar.`,
  // El único que dice dónde: cuando el proveedor entra a recepción, saber
  // el andén es lo que le sirve a quien está en piso. En los otros estados
  // el dato no aporta (todavía no llegó, o ya se fue).
  En_Recepcion: (p, anden) => `Proveedor ${p} se encuentra en recepción${fraseDeAnden(anden)}.`,
  Recibido: (p) => `Proveedor ${p} ya entregó su pedido.`,
  Atrasado: (p) => `Proveedor ${p} se encuentra atrasado.`,
  Rechazado: (p) => `Proveedor ${p} no llegó. Se encuentra rechazado.`,
};

/**
 * El pedacito " en el Andén B" que se le pega al anuncio de recepción.
 *
 * Devuelve cadena VACÍA si el horario no tiene andén cargado (la columna es
 * nullable) -> ahí el anuncio queda "se encuentra en recepción." y listo, en
 * vez de "se encuentra en recepción en el andén null".
 *
 * Los valores reales ya vienen escritos como "Andén A" o "Andén B", así que
 * anteponerle "el andén" a secas daría "en el andén Andén A". Por eso, si el
 * texto YA arranca nombrando el lugar, se usa tal cual y solo se le pone el
 * artículo que le corresponde: "el" para andén, "la" para puerta.
 */
export function fraseDeAnden(andenPuerta: string | null): string {
  const anden = andenPuerta?.trim();
  if (!anden) return '';

  // Sin tildes y en minúsculas para que "Andén", "anden" y "ANDEN" entren
  // todos por la misma rama.
  const comparable = anden
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (comparable.startsWith('puerta')) return ` en la ${anden}`;
  if (comparable.startsWith('anden')) return ` en el ${anden}`;

  // Un valor suelto tipo "B" o "3": hay que decirle qué es.
  return ` en el andén ${anden}`;
}

/**
 * Los nombres vienen de la base EN MAYÚSCULAS ("CORNUCOPIA",
 * "FROZENTROPIC"). Varios motores de voz leen una palabra toda en
 * mayúsculas como si fuera una sigla y la deletrean ("ce-o-erre-ene..."),
 * así que se pasa a Capitalizada antes de hablar. Solo se toca si TODO el
 * nombre está en mayúsculas: si ya viene mezclado, se respeta como está.
 *
 * Los puntos de las siglas societarias también estorban: "S.A." se lee
 * "ese punto a punto". Se quitan solo los puntos entre letras sueltas.
 */
export function normalizarNombreParaVoz(nombre: string): string {
  const limpio = nombre.replace(/\b([A-Za-zÁÉÍÓÚÑ])\.(?=[A-Za-zÁÉÍÓÚÑ]\b|\s|$)/g, '$1');

  const estaTodoEnMayusculas = limpio === limpio.toUpperCase();
  if (!estaTodoEnMayusculas) return limpio;

  return limpio
    .toLocaleLowerCase('es')
    .replace(/(^|\s|\/|-)([\p{L}])/gu, (_, sep, letra: string) => sep + letra.toLocaleUpperCase('es'));
}

/** El navegador de la TV puede no tener Web Speech (raro, pero pasa). */
export function soportaVoz(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Las voces se cargan de forma asíncrona: en el primer render
 * getVoices() suele devolver [] y recién después dispara 'voiceschanged'.
 * Por eso se cachea y se recalcula cuando el navegador avisa.
 */
let vozElegida: SpeechSynthesisVoice | null = null;

/** De más a menos parecido al español que se habla acá. */
const PREFERENCIA_IDIOMAS = ['es-ec', 'es-co', 'es-mx', 'es-us', 'es-419', 'es-es', 'es'];

function elegirVoz(): SpeechSynthesisVoice | null {
  const voces = window.speechSynthesis.getVoices();
  if (voces.length === 0) return null;

  for (const prefijo of PREFERENCIA_IDIOMAS) {
    const voz = voces.find((v) => v.lang.toLowerCase().replace('_', '-').startsWith(prefijo));
    if (voz) return voz;
  }

  return null;
}

/**
 * Se llama una vez al montar el Modo TV. Además de cachear la voz, deja
 * enganchado el 'voiceschanged' para el caso normal en Chrome, donde la
 * lista llega vacía en la primera vuelta.
 */
export function precalentarVoces(): void {
  if (!soportaVoz()) return;

  vozElegida = elegirVoz();

  if (!vozElegida) {
    window.speechSynthesis.addEventListener(
      'voiceschanged',
      () => {
        vozElegida = elegirVoz();
      },
      { once: true }
    );
  }
}

export interface OpcionesHablar {
  /**
   * El navegador bloqueó el audio por falta de interacción del usuario
   * (autoplay policy). Es el caso de una TV con la página abierta por URL
   * y sin que nadie haya tocado nada -> la pantalla lo usa para mostrar el
   * aviso de "tocá para activar los anuncios".
   */
  alBloquearse?: () => void;
}

// ---------------------------------------------------------------------------
// Campanita "din-don" (Web Audio)
// ---------------------------------------------------------------------------

/**
 * El "din-don" se SINTETIZA, no es un archivo de audio.
 *
 * Dos razones: no hay que sumar un binario al repo ni una petición más al
 * arrancar la TV, y sobre todo el tono queda afinado desde el código (si
 * mañana molesta que sea muy agudo, se cambia un número acá y listo).
 *
 * Son dos notas descendentes de campana, Mi5 -> Do5, que es el intervalo del
 * timbre clásico de aeropuerto. La envolvente (ataque cortito, caída larga y
 * exponencial) es lo que hace que suene a campana y no a "bip" de microondas.
 */
const NOTA_DIN = 659.25; // Mi5
const NOTA_DON = 523.25; // Do5
const RETARDO_ENTRE_NOTAS_S = 0.42;
const DURACION_CAMPANITA_MS = 1250;

/**
 * Pico de volumen de cada nota (0 a 1). Es lo ÚNICO del anuncio que se
 * puede subir por código: la voz ya sale en `volume = 1`, el máximo que
 * permite la Web Speech API, así que de ahí en más el único control real
 * es el volumen del televisor o del parlante.
 *
 * 0.85 y no 1 a propósito: las dos notas se superponen un instante (la
 * segunda entra mientras la primera todavía cae) y a volumen pleno esa
 * suma satura y se escucha un chasquido en vez de una campana.
 */
const VOLUMEN_CAMPANITA = 0.85;

/**
 * Velocidad de la voz (1 = normal). Baja a propósito: esto se escucha por
 * parlante, en bodega y con ruido de fondo, y lo que hay que entender sí o
 * sí es el NOMBRE del proveedor, que además suele ser una palabra rara que
 * el oído no puede completar solo si se le escapa una sílaba.
 *
 * Por debajo de ~0.7 la mayoría de las voces empiezan a sonar arrastradas y
 * se entiende peor, no mejor -> si hay que tocar esto, moverlo de a poco.
 */
const VELOCIDAD_VOZ = 0.82;

let contextoAudio: AudioContext | null = null;

function obtenerContextoAudio(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  const Constructor =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!Constructor) return null;

  contextoAudio ??= new Constructor();

  // Igual que la síntesis de voz, el contexto arranca 'suspended' hasta que
  // hay un gesto del usuario. Reanudarlo es inofensivo si ya estaba activo.
  if (contextoAudio.state === 'suspended') {
    void contextoAudio.resume().catch(() => {});
  }

  return contextoAudio;
}

function tocarNota(contexto: AudioContext, frecuencia: number, inicio: number, duracion: number): void {
  const oscilador = contexto.createOscillator();
  const ganancia = contexto.createGain();

  oscilador.type = 'sine';
  oscilador.frequency.value = frecuencia;

  // exponentialRampToValueAtTime no admite llegar a 0 exacto, por eso el
  // destino es 0.001 (inaudible) en vez de 0.
  ganancia.gain.setValueAtTime(0, inicio);
  ganancia.gain.linearRampToValueAtTime(VOLUMEN_CAMPANITA, inicio + 0.015);
  ganancia.gain.exponentialRampToValueAtTime(0.001, inicio + duracion);

  oscilador.connect(ganancia);
  ganancia.connect(contexto.destination);

  oscilador.start(inicio);
  oscilador.stop(inicio + duracion);
}

/** Suena el din-don y resuelve cuando terminó, para hablar recién después. */
export function reproducirCampanita(): Promise<void> {
  const contexto = obtenerContextoAudio();
  if (!contexto) return Promise.resolve();

  const t0 = contexto.currentTime + 0.05;
  tocarNota(contexto, NOTA_DIN, t0, 0.9);
  tocarNota(contexto, NOTA_DON, t0 + RETARDO_ENTRE_NOTAS_S, 1.1);

  return new Promise((resolver) => setTimeout(resolver, DURACION_CAMPANITA_MS));
}

// ---------------------------------------------------------------------------
// Cola de anuncios
// ---------------------------------------------------------------------------

/**
 * Chrome deja de reproducir si la síntesis quedó en pause (le pasa al
 * volver de un cambio de pestaña o tras un rato largo sin hablar). Un
 * resume() antes de encolar es inofensivo si no estaba pausada y
 * desatasca el caso en que sí lo estaba.
 */
function destrabarSiHaceFalta(): void {
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }
}

/**
 * Dice UNA frase y resuelve cuando terminó.
 *
 * El setTimeout de respaldo existe porque en Chrome el evento 'end' a veces
 * no llega nunca (bug conocido con utterances largas o si la pestaña pierde
 * foco). Sin ese respaldo, la cola quedaría trabada para siempre y no se
 * volvería a escuchar un solo anuncio hasta recargar la TV.
 */
function decir(texto: string, opciones: OpcionesHablar): Promise<void> {
  return new Promise((resolver) => {
    destrabarSiHaceFalta();

    const mensaje = new SpeechSynthesisUtterance(texto);
    mensaje.lang = vozElegida?.lang ?? 'es-ES';
    if (vozElegida) mensaje.voice = vozElegida;
    mensaje.rate = VELOCIDAD_VOZ;
    mensaje.pitch = 1;
    mensaje.volume = 1;

    let terminado = false;
    const terminar = () => {
      if (terminado) return;
      terminado = true;
      clearTimeout(respaldo);
      resolver();
    };

    // ~90 ms por carácter cubre de sobra el ritmo real, más 3 s de colchón.
    const respaldo = setTimeout(terminar, texto.length * 90 + 3000);

    mensaje.onend = terminar;
    mensaje.onerror = (evento) => {
      // 'not-allowed' = política de autoplay. 'interrupted'/'canceled' son
      // normales (cancelarTodo al desmontar) y no significan un problema.
      if (evento.error === 'not-allowed') {
        opciones.alBloquearse?.();
      }
      terminar();
    };

    window.speechSynthesis.speak(mensaje);
  });
}

/** Lotes pendientes. Cada lote = una campanita + sus frases seguidas. */
const lotesPendientes: string[][] = [];
let reproduciendoLote = false;

async function procesarLotes(opciones: OpcionesHablar): Promise<void> {
  if (reproduciendoLote) return;
  reproduciendoLote = true;

  try {
    while (lotesPendientes.length > 0) {
      const lote = lotesPendientes.shift();
      if (!lote?.length) continue;

      await reproducirCampanita();

      for (const texto of lote) {
        await decir(texto, opciones);
      }
    }
  } finally {
    reproduciendoLote = false;
  }
}

/**
 * Anuncia un LOTE de frases: una sola campanita al principio y después
 * todas las frases seguidas.
 *
 * Es por lote y no por frase a propósito. Cuando el refresco de 20 s trae
 * tres cambios juntos, un aeropuerto no toca el din-don tres veces: llama la
 * atención una vez y encadena los avisos. Si mientras habla entra un lote
 * nuevo, ese sí lleva su propia campanita, porque es una tanda nueva.
 */
export function anunciar(textos: string[], opciones: OpcionesHablar = {}): void {
  if (!soportaVoz() || textos.length === 0) return;

  lotesPendientes.push(textos);
  void procesarLotes(opciones);
}

/** Al salir del Modo TV: que no siga hablando sobre la pantalla siguiente. */
export function cancelarTodo(): void {
  lotesPendientes.length = 0;
  if (!soportaVoz()) return;
  window.speechSynthesis.cancel();
}
