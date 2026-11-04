import { useMemo } from 'react';
import { prefiereMenosMovimiento } from '../../hooks/useModoNavideno';

/**
 * Nieve suave por encima del portal (04-nov-2026, modo navideño).
 *
 * Criterios, porque es fácil que esto moleste en vez de alegrar:
 *  - pointer-events: none -> nunca tapa un clic ni un campo.
 *  - Por DEBAJO de los modales y de Hana (z-40): si un modal se abre, la nieve
 *    queda detrás y el contenido se lee limpio.
 *  - Pocos copos y chicos, en celeste de la marca (#BDDEEB) con un halo
 *    blanco: se ven sobre el fondo claro sin manchar, y brillan sobre la barra
 *    azul. Un puñado son estrellitas de seis puntas, para que no parezca polvo.
 *  - Solo CSS (transform/opacity): no recalcula el layout ni usa canvas.
 *  - Con "reducir movimiento" en el sistema, no se dibuja.
 */
const COPOS_ESCRITORIO = 42;
const COPOS_CELULAR = 20;

interface Copo {
  izquierda: number;
  tamano: number;
  duracion: number;
  retraso: number;
  vaiven: number;
  opacidad: number;
  estrella: boolean;
}

function armarCopos(cantidad: number): Copo[] {
  return Array.from({ length: cantidad }, (_, i) => {
    const estrella = i % 7 === 3;
    return {
      izquierda: Math.random() * 100,
      tamano: estrella ? 10 + Math.random() * 5 : 3.5 + Math.random() * 4,
      // Los grandes caen más lento: da sensación de profundidad.
      duracion: estrella ? 18 + Math.random() * 8 : 11 + Math.random() * 9,
      // Retraso negativo: al cargar la página ya está nevando, no empieza vacía.
      retraso: -Math.random() * 20,
      vaiven: 2.5 + Math.random() * 3,
      opacidad: 0.7 + Math.random() * 0.3,
      estrella,
    };
  });
}

function Estrella({ tamano }: { tamano: number }) {
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="3.3" y1="7" x2="20.7" y2="17" />
      <line x1="3.3" y1="17" x2="20.7" y2="7" />
      <path d="M9.5 3.8 12 6.2l2.5-2.4M9.5 20.2 12 17.8l2.5 2.4" />
    </svg>
  );
}

export default function Nevada({ enCaja = false }: { enCaja?: boolean }) {
  const copos = useMemo(() => {
    const angosto = typeof window !== 'undefined' && window.innerWidth < 640;
    return armarCopos(enCaja ? 14 : angosto ? COPOS_CELULAR : COPOS_ESCRITORIO);
  }, [enCaja]);

  if (prefiereMenosMovimiento()) return null;

  return (
    <div
      aria-hidden="true"
      className={`${enCaja ? 'absolute' : 'fixed'} inset-0 overflow-hidden pointer-events-none z-40`}
    >
      {copos.map((c, i) => (
        <span
          key={i}
          className="copo-caer absolute top-0"
          style={{ left: `${c.izquierda}%`, animationDuration: `${c.duracion}s`, animationDelay: `${c.retraso}s` }}
        >
          <span
            className="copo-vaiven block"
            style={{ animationDuration: `${c.vaiven}s`, opacity: c.opacidad }}
          >
            {c.estrella ? (
              <span className="block copo-estrella">
                <Estrella tamano={c.tamano} />
              </span>
            ) : (
              <span className="block rounded-full copo-punto" style={{ width: c.tamano, height: c.tamano }} />
            )}
          </span>
        </span>
      ))}
    </div>
  );
}
