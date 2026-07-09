import { useEffect, useState } from 'react';

interface Slide {
  eyebrow: string;
  titulo: string;
  descripcion: string;
}

const SLIDES: Slide[] = [
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
  const [indice, setIndice] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndice((i) => (i + 1) % SLIDES.length);
        setVisible(true);
      }, 250);
    }, 5000);
    return () => clearInterval(intervalo);
  }, []);

  function irA(i: number) {
    setVisible(false);
    setTimeout(() => {
      setIndice(i);
      setVisible(true);
    }, 200);
  }

  const slide = SLIDES[indice];

  return (
    <div className="grid md:grid-cols-2 gap-12 items-center">
      <div className={`transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
        <p className="text-sm uppercase tracking-[0.2em] text-brand-700 mb-4 font-semibold">{slide.eyebrow}</p>
        <h2 className="font-display text-4xl md:text-5xl leading-tight text-brand-900 mb-5">{slide.titulo}</h2>
        <p className="text-lg text-brand-900/70 max-w-md mb-8">{slide.descripcion}</p>

        <div className="flex gap-2">
          {SLIDES.map((_, i) => (
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
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900 via-brand-700 to-brand-wine/60" />
        <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full p-14 text-brand-yellow" fill="none">
          {indice === 0 && (
            <g stroke="currentColor" strokeWidth="2">
              <rect x="40" y="60" width="120" height="90" rx="8" />
              <path d="M40 90 h120" />
              <path d="M100 60 v30" />
              <path d="M70 130 h20 M110 130 h20" strokeLinecap="round" />
            </g>
          )}
          {indice === 1 && (
            <g stroke="currentColor" strokeWidth="2">
              <circle cx="100" cy="100" r="55" />
              <path d="M78 100 l16 16 l30 -34" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          )}
          {indice === 2 && (
            <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M45 140 l35 -40 l30 25 l45 -55" />
              <path d="M120 70 h35 v35" />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}