import { useEffect, useRef, useState } from 'react';
import { obtenerHomeSlides, type HomeSlidePublico } from '../../../shared/api/publicConfigApi';

interface SlideRespaldo {
  eyebrow: string;
  titulo: string;
  descripcion: string;
}

type Slide = HomeSlidePublico | SlideRespaldo;

function esSlideReal(s: Slide): s is HomeSlidePublico {
  return 'Id_Home_Slide' in s;
}

// Si el backend todavía no tiene slides configurados (o la petición falla),
// se muestra este contenido fijo para que la landing nunca se vea vacía.
const SLIDES_RESPALDO: SlideRespaldo[] = [
  {
    eyebrow: 'Postulación',
    titulo: 'Registra tu ficha en minutos',
    descripcion: 'El proveedor completa su información, sube su documentación y guarda el avance en cualquier momento.',
  },
  {
    eyebrow: 'Evaluación',
    titulo: 'Calidad revisa cada certificación',
    descripcion: 'El equipo de calidad valida documentos y clasifica al proveedor según sus categorías de producto.',
  },
  {
    eyebrow: 'Seguimiento',
    titulo: 'Proveedores activos, siempre al día',
    descripcion: 'Alertas automáticas antes de que un proveedor pierda su estado activo por documentación vencida.',
  },
];

const INTERVALO_MS = 6000;
// Si por red lenta la capa oculta no queda lista a tiempo para el cambio
// automático, se le da este margen extra antes de forzar el cambio igual
// (mejor mostrarlo "a medio cargar" que dejar la landing congelada).
const TOPE_ESPERA_EXTRA_MS = 4000;

/**
 * Carrusel del hero de la landing.
 *
 * CÓMO EVITA EL FLASH DE CARGA DEL VIDEO (ícono de "cargando/reproducir"
 * antes de que el video real aparezca):
 *
 * Intentamos antes precargar el siguiente video en un <video> aparte,
 * invisible/desconectado del DOM, y solo cuando terminaba de "precargar"
 * recién montábamos el <video> real y visible. Eso NO funcionaba: cada
 * <video> nuevo en el DOM (aunque apunte a la misma URL ya vista antes)
 * repite su propio proceso de inicialización desde cero (loadstart ->
 * loadedmetadata -> loadeddata -> canplay -> playing), y ese proceso
 * completo tarda ~250-300ms sin importar que el archivo ya esté en caché
 * -> el <video> "precargado" quedaba listo rápido, pero el <video> VISIBLE
 * (uno completamente distinto) igual tenía que repetir esos ~300ms desde
 * cero, y ESE hueco es el que se veía como el ícono de carga.
 *
 * La solución real: en vez de destruir y crear un <video> nuevo en cada
 * cambio de slide, se mantienen DOS elementos de video/imagen PERMANENTES
 * en el DOM (nunca se desmontan mientras el carrusel vive), alternando
 * cuál de los dos está arriba (opacity-100) y cuál abajo (opacity-0).
 *
 * El slide que sigue se carga en la capa que está OCULTA en este momento,
 * con hasta 6 segundos de margen (todo el intervalo entre rotaciones)
 * para terminar su proceso de inicialización SIN que nadie lo vea. El
 * cambio visual (revelar esa capa) solo ocurre cuando su <video> ya
 * disparó el evento 'playing' (ya está reproduciendo cuadros de verdad,
 * no solo "técnicamente listo"), así que al revelarla no hay ningún hueco
 * que mostrar.
 */
export default function HeroCarousel() {
  const [slides, setSlides] = useState<Slide[]>(SLIDES_RESPALDO);

  // Las dos capas físicas del DOM y qué slide tiene cargado cada una.
  const [capas, setCapas] = useState<[Slide, Slide]>([
    SLIDES_RESPALDO[0],
    SLIDES_RESPALDO[1] ?? SLIDES_RESPALDO[0],
  ]);
  // Cuál de las dos capas está arriba (visible) ahora mismo.
  const [activo, setActivo] = useState<0 | 1>(0);

  // Mientras esto sea false, se muestra un spinner encima del degradado
  // de respaldo -> le avisa al usuario que el video/imagen real está en
  // camino, en vez de dejarlo viendo el fondo pelado sin ninguna señal
  // de que algo está cargando.
  const [primerRealListo, setPrimerRealListo] = useState(false);

  // Refs espejo del estado, para leer valores frescos dentro de callbacks
  // async (eventos del navegador, timeouts) sin depender de closures viejas.
  const slidesRef = useRef(slides);
  const activoRef = useRef(activo);
  const capasRef = useRef(capas);
  const primerRealListoRef = useRef(primerRealListo);

  // La sincronización va en un efecto y no en el cuerpo del componente:
  // escribir una ref durante el render es justo lo que la regla
  // react-hooks/refs prohíbe (y con razón, porque el render puede repetirse o
  // descartarse). Un efecto SIN arreglo de dependencias corre después de cada
  // render, que es exactamente lo que hacía la asignación directa, y los
  // valores solo se leen desde callbacks asíncronos que ocurren después de
  // pintar.
  useEffect(() => {
    slidesRef.current = slides;
    activoRef.current = activo;
    capasRef.current = capas;
    primerRealListoRef.current = primerRealListo;
  });

  // Si cada capa ya está "lista" para mostrarse (los slides de respaldo,
  // al no tener video/imagen, arrancan listos de una vez).
  const capaListaRef = useRef<[boolean, boolean]>([true, true]);
  const esperandoSwapRef = useRef(false);
  const topeRef = useRef<number | null>(null);
  const montadoRef = useRef(true);

  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  // --- Datos reales de la API: se cargan en la capa OCULTA, sin tocar lo
  // que ya se está mostrando, y solo se revelan cuando ya están listos. ---
  useEffect(() => {
    obtenerHomeSlides()
      .then((data) => {
        if (!montadoRef.current) return;
        if (data.length === 0) {
          // No hay slides configurados: se queda con SLIDES_RESPALDO para
          // siempre -> ningún slide real va a "quedar listo" para apagar
          // el spinner, así que se apaga acá para no dejarlo girando de
          // por vida sobre el degradado de respaldo.
          setPrimerRealListo(true);
          return;
        }
        setSlides(data);
        const oculta = activoRef.current === 0 ? 1 : 0;
        capaListaRef.current[oculta] = false;
        setCapas((prev) => {
          const nuevo = [...prev] as [Slide, Slide];
          nuevo[oculta] = data[0];
          return nuevo;
        });
      })
      .catch(() => {
        // Se queda con SLIDES_RESPALDO si falla -> mismo motivo que arriba,
        // el spinner tiene que apagarse igual.
        if (montadoRef.current) setPrimerRealListo(true);
      });
  }, []);

  function siguienteSlideDespuesDe(s: Slide): Slide {
    const arr = slidesRef.current;
    const idx = arr.indexOf(s);
    const siguienteIdx = idx === -1 ? 0 : (idx + 1) % arr.length;
    return arr[siguienteIdx];
  }

  function intentarAvanzar() {
    const oculta = activoRef.current === 0 ? 1 : 0;
    if (capaListaRef.current[oculta]) {
      revelarOculta();
      return;
    }
    // Todavía no está lista (red lenta) -> se espera a que dispare su
    // evento de "lista" (ver onCapaLista), con un tope máximo por si
    // nunca llega.
    esperandoSwapRef.current = true;
    if (topeRef.current) clearTimeout(topeRef.current);
    topeRef.current = window.setTimeout(() => {
      if (esperandoSwapRef.current) revelarOculta();
    }, TOPE_ESPERA_EXTRA_MS);
  }

  function revelarOculta() {
    if (!montadoRef.current) return;
    esperandoSwapRef.current = false;
    if (topeRef.current) {
      clearTimeout(topeRef.current);
      topeRef.current = null;
    }

    const viejoActivo = activoRef.current;
    const oculta = viejoActivo === 0 ? 1 : 0;
    const slideRevelado = capasRef.current[oculta];

    setActivo(oculta);
    if (esSlideReal(slideRevelado)) {
      setPrimerRealListo(true);
    }

    // La capa que acaba de quedar oculta (la que era visible hasta hace
    // un instante) se reutiliza para precargar el slide que sigue, con
    // todo el intervalo de 6s por delante para estar lista sin apuro.
    const siguiente = siguienteSlideDespuesDe(slideRevelado);
    capaListaRef.current[viejoActivo] = false;
    setCapas((prev) => {
      const nuevo = [...prev] as [Slide, Slide];
      nuevo[viejoActivo] = siguiente;
      return nuevo;
    });
  }

  function onCapaLista(capa: 0 | 1) {
    capaListaRef.current[capa] = true;
    const oculta = activoRef.current === 0 ? 1 : 0;
    if (capa !== oculta) return;

    // El primer slide REAL (no el de respaldo) se revela apenas está
    // listo, sin esperar el intervalo de 6s -> antes, aunque el poster ya
    // estaba precargado en 200-300ms, el spinner igual se quedaba puesto
    // hasta el primer tick de intentarAvanzar() (hasta 6s después), que es
    // la demora que se sentía. Los cambios de slide SIGUIENTES sí esperan
    // su turno normal (esa parte no cambia).
    const primeraRevelacionInmediata = !primerRealListoRef.current && esSlideReal(capasRef.current[capa]);

    if (esperandoSwapRef.current || primeraRevelacionInmediata) {
      revelarOculta();
    }
  }

  /**
   * Con poster la capa se puede revelar SIN esperar al video.
   *
   * El motivo original de esperar el evento 'playing' era no mostrar el hueco
   * de inicialización del <video> (el ícono de carga). El poster tapa ese
   * hueco: es la misma imagen del primer cuadro, dentro del mismo elemento, y
   * el video la reemplaza cuando arranca. Así el hero deja de mostrar el
   * spinner durante toda la descarga del video, que es lo que se sentía lento.
   *
   * Se precarga con new Image() en vez de confiar en el navegador: hace falta
   * saber CUÁNDO está pintable para marcar la capa lista, y el <video> no
   * avisa por su poster. La imagen ya queda en caché, así que el elemento no
   * la vuelve a pedir.
   */
  useEffect(() => {
    const posters = ([0, 1] as const)
      .map((capa) => {
        const slide = capas[capa];

        return { capa, poster: esSlideReal(slide) ? (slide.Ruta_Poster ?? null) : null };
      })
      .filter((x): x is { capa: 0 | 1; poster: string } => x.poster !== null);

    const precargas = posters.map(({ capa, poster }) => {
      const img = new Image();
      img.src = poster;

      const marcar = () => onCapaLista(capa);

      if (img.complete) {
        marcar();
      } else {
        img.addEventListener('load', marcar);
      }

      return { img, marcar };
    });

    return () => {
      precargas.forEach(({ img, marcar }) => img.removeEventListener('load', marcar));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capas]);

  // --- Rotación automática cada 6s ---
  //
  // Va DESPUÉS de intentarAvanzar y no antes: aunque la declaración de función
  // se eleva, leerla desde arriba rompe el análisis del linter de hooks (y de
  // paso se lee peor).
  useEffect(() => {
    const intervalo = setInterval(() => {
      intentarAvanzar();
    }, INTERVALO_MS);

    return () => clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function irA(slideDestino: Slide) {
    if (slideDestino === capasRef.current[activoRef.current]) return;
    const oculta = activoRef.current === 0 ? 1 : 0;
    capaListaRef.current[oculta] = false;
    setCapas((prev) => {
      const nuevo = [...prev] as [Slide, Slide];
      nuevo[oculta] = slideDestino;
      return nuevo;
    });
    esperandoSwapRef.current = true;
    if (topeRef.current) clearTimeout(topeRef.current);
    topeRef.current = window.setTimeout(() => {
      if (esperandoSwapRef.current) revelarOculta();
    }, TOPE_ESPERA_EXTRA_MS);
  }

  function renderCapa(capa: 0 | 1) {
    const slide = capas[capa];
    const activa = activo === capa;
    const ruta = esSlideReal(slide) ? slide.Ruta_Media : null;
    const tipo = esSlideReal(slide) ? slide.Tipo_Media : null;
    const poster = esSlideReal(slide) ? (slide.Ruta_Poster ?? null) : null;

    return (
      <div
        key={capa}
        className={`absolute inset-0 transition-opacity duration-500 ${
          activa ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
        }`}
      >
        {ruta ? (
          tipo === 'video' ? (
            <video
              key={ruta}
              src={ruta}
              // El poster tapa exactamente el hueco que antes obligaba a
              // esperar: se pinta con ~25 KB y el video lo reemplaza sin salto
              // cuando arranca. Si el slide no tiene poster, el atributo va
              // vacío y todo se comporta como antes.
              poster={poster ?? undefined}
              muted
              loop
              autoPlay
              playsInline
              preload="auto"
              className="w-full h-full object-cover"
              onPlaying={() => onCapaLista(capa)}
              onError={() => onCapaLista(capa)}
            />
          ) : (
            <img
              key={ruta}
              src={ruta}
              alt=""
              className="w-full h-full object-cover"
              onLoad={() => onCapaLista(capa)}
              onError={() => onCapaLista(capa)}
            />
          )
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-900 via-brand-700 to-brand-wine/60" />
        )}
      </div>
    );
  }

  const slideMostrado = capas[activo];

  return (
    <>
      {/* Media a pantalla completa: dos capas permanentes superpuestas,
          alternando cuál está arriba (ver comentario grande arriba). */}
      {renderCapa(0)}
      {renderCapa(1)}

      {/* Spinner mientras se carga el primer video/imagen real desde el
          backend -> sin esto, el usuario solo veía el degradado pelado
          sin ninguna señal de que algo estaba cargando en camino. Se
          esconde apenas se revela el primer slide real y no vuelve a
          aparecer (las rotaciones siguientes ya van precargadas de
          fondo con tiempo de sobra, no necesitan spinner). */}
      {!primerRealListo && (
        <div className="absolute inset-0 z-[15] flex items-center justify-center">
          <div className="h-10 w-10 rounded-full border-[3px] border-white/25 border-t-brand-yellow animate-spin" />
        </div>
      )}

      {/* Degradado oscuro de abajo hacia arriba -> el video se ve entero,
          pero el texto (que vive abajo) siempre tiene con qué contrastar,
          sin importar qué tan clara sea esa parte puntual del video. */}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-900/95 via-brand-900/25 to-transparent z-20" />

      <div className="absolute inset-x-0 bottom-0 px-8 md:px-16 pb-14 md:pb-20 z-30">
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.2em] text-brand-yellow mb-4 font-semibold">
            {esSlideReal(slideMostrado) ? slideMostrado.Eyebrow : slideMostrado.eyebrow}
          </p>
          <h2 className="font-display text-3xl md:text-5xl font-bold uppercase leading-[1.1] text-white mb-5">
            {esSlideReal(slideMostrado) ? slideMostrado.Titulo : slideMostrado.titulo}
          </h2>
          <p className="text-base md:text-lg text-white/85 max-w-xl mb-8">
            {esSlideReal(slideMostrado) ? slideMostrado.Descripcion : slideMostrado.descripcion}
          </p>

          <div className="flex gap-2">
            {slides.map((s, i) => (
              <button
                key={i}
                onClick={() => irA(s)}
                aria-label={`Ir a la diapositiva ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  s === slideMostrado ? 'w-8 bg-brand-yellow' : 'w-4 bg-white/25'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
