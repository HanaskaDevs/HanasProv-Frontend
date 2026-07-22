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
    }, 5000);
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
    <div className="grid md:grid-cols-2 gap-12 items-center">
      <div className={`transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
        <p className="text-sm uppercase tracking-[0.2em] text-brand-700 mb-4 font-semibold">
          {'Eyebrow' in slide ? slide.Eyebrow : slide.eyebrow}
        </p>
        <h2 className="font-display text-4xl md:text-5xl leading-tight text-brand-900 mb-5">
          {'Titulo' in slide ? slide.Titulo : slide.titulo}
        </h2>
        <p className="text-lg text-brand-900/70 max-w-md mb-8">
          {'Descripcion' in slide ? slide.Descripcion : slide.descripcion}
        </p>

        <div className="flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => irA(i)}
              aria-label={`Ir a la diapositiva ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === indice ? 'w-8 bg-brand-wine' : 'w-4 bg-brand-900/15'
              }`}
            />
          ))}
        </div>
      </div>

      <div
        className={`relative aspect-[4/3] rounded-3xl overflow-hidden bg-brand-900 shadow-xl transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {rutaMedia ? (
          tipoMedia === 'video' ? (
            <video src={rutaMedia} muted loop autoPlay playsInline className="w-full h-full object-cover" />
          ) : (
            <img src={rutaMedia} alt="" className="w-full h-full object-cover" />
          )
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-brand-900 via-brand-700 to-brand-wine/60" />
            <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full p-14 text-brand-yellow" fill="none">
              {indice % 3 === 0 && (
                <g stroke="currentColor" strokeWidth="2">
                  <rect x="40" y="60" width="120" height="90" rx="8" />
                  <path d="M40 90 h120" />
                  <path d="M100 60 v30" />
                  <path d="M70 130 h20 M110 130 h20" strokeLinecap="round" />
                </g>
              )}
              {indice % 3 === 1 && (
                <g stroke="currentColor" strokeWidth="2">
                  <circle cx="100" cy="100" r="55" />
                  <path d="M78 100 l16 16 l30 -34" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              )}
              {indice % 3 === 2 && (
                <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M45 140 l35 -40 l30 25 l45 -55" />
                  <path d="M120 70 h35 v35" />
                </g>
              )}
            </svg>
          </>
        )}
      </div>
    </div>
  );
}