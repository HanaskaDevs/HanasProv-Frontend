import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as bannerApi from '../api/bannerApi';
import { marcaActual, marcaCerrada, recordarCierre, tieneContenido } from '../utils/cierreBanner';

function IconoFlecha({ hacia }: { hacia: 'izquierda' | 'derecha' }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points={hacia === 'izquierda' ? '15 18 9 12 15 6' : '9 18 15 12 9 6'} />
    </svg>
  );
}

/**
 * El aviso que Sistemas enciende y ve todo el que inicia sesión. Se cierra
 * con la X de arriba a la derecha, con Escape, o tocando fuera.
 */
export default function ModalBannerInformativo() {
  const [cerrado, setCerrado] = useState(false);
  const [indice, setIndice] = useState(0);
  /**
   * Proporción (ancho/alto) de la pieza que se está mostrando, leída del
   * archivo ya cargado.
   *
   * POR QUÉ HACE FALTA MEDIRLA. Con solo CSS no alcanza: un contenedor
   * que se encoge al contenido usa el ancho INTRÍNSECO de la imagen para
   * decidir su tamaño, no el ancho al que esa imagen va a quedar después
   * de limitarle la altura. Con un afiche vertical de 1000x1400, el modal
   * se quedaba en su ancho máximo y la imagen se dibujaba angosta en el
   * medio, con dos franjas oscuras a los lados. Sabiendo la proporción,
   * el ancho del modal se calcula exacto y no sobra ni un píxel.
   */
  const [proporciones, setProporciones] = useState<Record<number, number>>({});

  /**
   * Se guarda POR PIEZA y no una sola: así, al volver a una imagen ya
   * vista, el modal toma su ancho de entrada en vez de parpadear mientras
   * se vuelve a medir. De paso evita el efecto que haría falta para
   * reiniciarla al cambiar de pieza.
   */
  function medir(id: number, ancho: number, alto: number) {
    if (!ancho || !alto) return;
    setProporciones((previas) => (previas[id] ? previas : { ...previas, [id]: ancho / alto }));
  }

  const { data: banner } = useQuery({
    queryKey: ['banner-informativo'],
    queryFn: bannerApi.obtenerBanner,
    retry: false,
    // El banner cambia poco y esto lo pide cada usuario al entrar: no
    // tiene sentido volver a consultarlo al cambiar de pestaña.
    staleTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  /*
   * Cuatro condiciones, y la de tieneContenido no es de adorno: sin ella,
   * un banner encendido al que se le borró la última imagen dibujaba una
   * tarjeta vacía sobre la pantalla oscurecida. Se veía como la página
   * colgada.
   *
   * La audiencia ya la filtró el backend: si a este usuario no le
   * corresponde, 'activo' llega en false.
   */
  const visible =
    !cerrado &&
    banner?.activo === true &&
    tieneContenido(banner) &&
    marcaCerrada() !== marcaActual(banner);

  useEffect(() => {
    if (!visible) return;

    function alPresionar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') cerrar();
    }

    document.addEventListener('keydown', alPresionar);
    return () => document.removeEventListener('keydown', alPresionar);
  });


  if (!visible || !banner) return null;

  const piezas = banner.piezas;
  const pieza = piezas[indice];
  const proporcionActual = pieza ? proporciones[pieza.id_banner_informativo] : undefined;
  const hayVarias = piezas.length > 1;

  function cerrar() {
    recordarCierre(marcaActual(banner!));
    setCerrado(true);
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-900/70 p-4 backdrop-blur-sm"
      onClick={cerrar}
      role="dialog"
      aria-modal="true"
      aria-label={banner.titulo ?? 'Aviso'}
    >
      {/*
        EL MODAL SE ADAPTA A LA FORMA DE LA IMAGEN, no al revés.
        Antes tenía un ancho fijo (max-w-2xl) y la imagen se centraba
        adentro: con un afiche vertical -que es el caso real- quedaban dos
        franjas oscuras enormes a los costados y la imagen diminuta en el
        medio. Ahora el ancho lo decide la imagen (w-auto), así que un
        afiche vertical da un modal angosto y alto, y uno apaisado, uno
        ancho. Los topes en vw/vh son los que impiden que se salga de la
        pantalla en cualquiera de los dos casos.
      */}
      <div
        className="relative flex max-h-[92vh] w-full max-w-[min(95vw,900px)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        /*
         * El ancho se calcula a partir de la proporción real: nunca más
         * ancho de lo que la imagen ocuparía con 78vh de alto. Así un
         * afiche vertical da un modal angosto y alto, y uno apaisado, uno
         * ancho, sin franjas vacías en ninguno de los dos casos. Mientras
         * la imagen no cargó, manda el máximo de siempre.
         */
        style={
          proporcionActual
            ? { width: `min(95vw, 900px, calc(78vh * ${proporcionActual}))` }
            : undefined
        }
        onClick={(e) => e.stopPropagation()}
      >
        {/* La X va FLOTANDO sobre el contenido y no en una barra de
            título: el banner puede ser solo una imagen, sin título, y una
            barra vacía arriba se vería como un error. El fondo oscuro
            semitransparente la mantiene visible sobre cualquier imagen. */}
        <button
          onClick={cerrar}
          aria-label="Cerrar aviso"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-brand-900/55 text-white backdrop-blur-sm transition-colors hover:bg-brand-900/80"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {pieza?.url_media && (
          <div className="relative flex min-h-0 shrink items-center justify-center bg-brand-900">
            {pieza.tipo_media === 'video' ? (
              <video
                key={pieza.id_banner_informativo}
                src={pieza.url_media}
                /* h-auto/w-auto: el video conserva su proporción y el
                   modal se ajusta a él. */
                className="max-h-[78vh] w-full object-contain"
                onLoadedMetadata={(e) =>
                  medir(pieza.id_banner_informativo, e.currentTarget.videoWidth, e.currentTarget.videoHeight)
                }
                controls
                autoPlay
                muted
                playsInline
              />
            ) : (
              <img
                src={pieza.url_media}
                alt={pieza.titulo ?? 'Aviso'}
                className="block h-auto max-h-[78vh] w-full object-contain"
                onLoad={(e) =>
                  medir(pieza.id_banner_informativo, e.currentTarget.naturalWidth, e.currentTarget.naturalHeight)
                }
              />
            )}

            {hayVarias && (
              <>
                <button
                  onClick={() => setIndice((i) => (i - 1 + piezas.length) % piezas.length)}
                  aria-label="Anterior"
                  className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-brand-900/55 text-white backdrop-blur-sm transition-colors hover:bg-brand-900/80"
                >
                  <IconoFlecha hacia="izquierda" />
                </button>
                <button
                  onClick={() => setIndice((i) => (i + 1) % piezas.length)}
                  aria-label="Siguiente"
                  className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-brand-900/55 text-white backdrop-blur-sm transition-colors hover:bg-brand-900/80"
                >
                  <IconoFlecha hacia="derecha" />
                </button>

                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                  {piezas.map((p, i) => (
                    <button
                      key={p.id_banner_informativo}
                      onClick={() => setIndice(i)}
                      aria-label={`Ver aviso ${i + 1}`}
                      className={`h-1.5 rounded-full transition-all ${
                        i === indice ? 'w-5 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* El bloque de texto solo existe si hay algo que decir: un banner
            que es puramente una imagen no lleva ningún espacio en blanco
            debajo. */}
        {(banner.titulo || banner.mensaje || pieza?.titulo || pieza?.descripcion) && (
          <div className="max-h-[30vh] shrink-0 overflow-y-auto px-6 py-5">
            {banner.titulo && (
              <h2 className="font-display text-xl font-semibold text-brand-900">{banner.titulo}</h2>
            )}
            {banner.mensaje && (
              <p className="mt-1.5 text-sm leading-relaxed text-brand-900/70">{banner.mensaje}</p>
            )}

            {(pieza?.titulo || pieza?.descripcion) && (
              <div className={banner.titulo || banner.mensaje ? 'mt-4 border-t border-brand-900/8 pt-3' : ''}>
                {pieza?.titulo && (
                  <p className="text-sm font-medium text-brand-900">{pieza.titulo}</p>
                )}
                {pieza?.descripcion && (
                  <p className="mt-1 text-sm leading-relaxed text-brand-900/65">{pieza.descripcion}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
