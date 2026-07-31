import { useEffect, useState } from 'react';
import { obtenerHomeSlides, type HomeSlidePublico } from '../../../shared/api/publicConfigApi';

interface SlideRespaldo {
  eyebrow: string;
  titulo: string;
  descripcion: string;
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

export default function HeroCarousel() {
  const [slides, setSlides] = useState<(HomeSlidePublico | SlideRespaldo)[]>(SLIDES_RESPALDO);
  const [indice, setIndice] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    obtenerHomeSlides()
      .then((data) => {
        if (data.length > 0) setSlides(data);
      })
      .catch(() => {
        // Se queda con SLIDES_RESPALDO si falla.
      });
  }, []);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndice((i) => (i + 1) % slides.length);
        setVisible(true);
      }, 250);
    }, 6000);
    return () => clearInterval(intervalo);
  }, [slides.length]);

  function irA(i: number) {
    setVisible(false);
    setTimeout(() => {
      setIndice(i);
      setVisible(true);
    }, 200);
  }

  const slide = slides[indice] ?? slides[0];
  const esSlideReal = 'Id_Home_Slide' in slide;
  const rutaMedia = esSlideReal ? (slide as HomeSlidePublico).Ruta_Media : null;
  const tipoMedia = esSlideReal ? (slide as HomeSlidePublico).Tipo_Media : null;

  return (
    <>
      {/* Media a pantalla completa (antes vivía en una tarjeta chica a un
          costado) -> cubre toda la sección del hero, con el texto
          superpuesto encima en vez de al lado.

          OJO: esto se ancla directo al contenedor relativo del padre
          (<main> en LandingPage) con "absolute inset-0" en vez de
          depender de "h-full" en cascada por varios niveles -> eso fue
          justo el bug: alguno de esos niveles no terminaba de resolver
          una altura definida, y el video quedaba con 0px de alto aunque
          la petición de red cargara perfecto. */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
        {rutaMedia ? (
          tipoMedia === 'video' ? (
            <video
              key={rutaMedia}
              src={rutaMedia}
              muted
              loop
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img key={rutaMedia} src={rutaMedia} alt="" className="w-full h-full object-cover" />
          )
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-900 via-brand-700 to-brand-wine/60" />
        )}
      </div>

      {/* Degradado oscuro de abajo hacia arriba -> el video se ve entero,
          pero el texto (que vive abajo) siempre tiene con qué contrastar,
          sin importar qué tan clara sea esa parte puntual del video. */}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-900/95 via-brand-900/25 to-transparent" />

      <div
        className={`absolute inset-x-0 bottom-0 px-8 md:px-16 pb-14 md:pb-20 transition-opacity duration-500 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.2em] text-brand-yellow mb-4 font-semibold">
            {'Eyebrow' in slide ? slide.Eyebrow : slide.eyebrow}
          </p>
          <h2 className="font-display text-3xl md:text-5xl font-bold uppercase leading-[1.1] text-white mb-5">
            {'Titulo' in slide ? slide.Titulo : slide.titulo}
          </h2>
          <p className="text-base md:text-lg text-white/85 max-w-xl mb-8">
            {'Descripcion' in slide ? slide.Descripcion : slide.descripcion}
          </p>

          <div className="flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => irA(i)}
                aria-label={`Ir a la diapositiva ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === indice ? 'w-8 bg-brand-yellow' : 'w-4 bg-white/25'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}