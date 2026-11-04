import { useEffect, useState } from 'react';

/**
 * Guirnalda de luces colgando del borde inferior de la barra azul
 * (04-nov-2026, modo navideño).
 *
 * Es una tira de "tramos" de 120 px repetidos a lo ancho: cada tramo es un
 * cable con dos curvas y dos focos. Se arma con tramos (y no con un solo SVG
 * estirado) para que los focos nunca se deformen en pantallas anchas o
 * angostas.
 *
 * El cable es verde pino oscuro y no blanco: cuelga sobre el contenido CLARO,
 * y un cable blanco ahí desaparecía y los focos quedaban flotando sueltos
 * (visto al revisarlo en el navegador). Cada foco lleva un borde fino oscuro
 * por lo mismo: el celeste y el dorado, sin borde, casi no se distinguían
 * sobre el fondo blanco.
 *
 * Colores de la marca, aclarados para que brillen: rojo vino, dorado
 * (#E2DE3D), celeste (#BDDEEB) y verde pino. Cada foco titila con su propio
 * retraso, así la tira "respira" en vez de prenderse y apagarse toda junta.
 *
 * No recibe clics (pointer-events: none).
 */
const ANCHO_TRAMO = 120;
const COLORES = ['#e84a50', '#e6dd2e', '#9fd3ea', '#36b37e'];

function Tramo({ indice }: { indice: number }) {
  const focos = [
    { x: 30, y: 13 },
    { x: 90, y: 13 },
  ];

  return (
    <svg width={ANCHO_TRAMO} height="34" viewBox={`0 0 ${ANCHO_TRAMO} 34`} className="shrink-0 overflow-visible">
      {/* Cable: una línea oscura y, encima, un brillo fino para que tenga relieve */}
      <path d="M0 1 Q 30 24 60 1 Q 90 24 120 1" fill="none" stroke="#1d3a30" strokeWidth="1.7" />
      <path d="M0 0.4 Q 30 23.4 60 0.4 Q 90 23.4 120 0.4" fill="none" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="0.6" />
      {focos.map((f, j) => {
        const n = indice * 2 + j;
        const color = COLORES[n % COLORES.length];
        // Cada foco cuelga apenas torcido, alternando el lado: menos rígido.
        const giro = n % 2 === 0 ? -9 : 8;
        return (
          <g key={j} transform={`translate(${f.x} ${f.y}) rotate(${giro})`}>
            <rect x="-2.4" y="-1" width="4.8" height="4.2" rx="1" fill="#2b3f37" />
            <g className="foco-titilar" style={{ animationDelay: `${(n % 7) * 0.37}s`, color }}>
              <path
                d="M0 2.8 C 4.6 3.4, 5.2 9.6, 0 14 C -5.2 9.6, -4.6 3.4, 0 2.8 Z"
                fill={color}
                stroke="#142831"
                strokeOpacity="0.35"
                strokeWidth="0.6"
              />
              <ellipse cx="-1.5" cy="6.6" rx="1.1" ry="2.2" fill="#ffffff" opacity="0.6" />
            </g>
          </g>
        );
      })}
    </svg>
  );
}

export default function GuirnaldaLuces() {
  const [tramos, setTramos] = useState(() =>
    typeof window === 'undefined' ? 12 : Math.ceil(window.innerWidth / ANCHO_TRAMO) + 1
  );

  useEffect(() => {
    const recalcular = () => setTramos(Math.ceil(window.innerWidth / ANCHO_TRAMO) + 1);
    window.addEventListener('resize', recalcular);
    return () => window.removeEventListener('resize', recalcular);
  }, []);

  return (
    <div aria-hidden="true" className="relative h-0 z-20 pointer-events-none">
      <div className="absolute left-0 right-0 top-0 flex overflow-hidden" style={{ height: 34 }}>
        {Array.from({ length: tramos }, (_, i) => (
          <Tramo key={i} indice={i} />
        ))}
      </div>
    </div>
  );
}
