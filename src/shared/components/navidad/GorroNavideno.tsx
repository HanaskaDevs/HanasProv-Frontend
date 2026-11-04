import { useId, type CSSProperties } from 'react';

/**
 * Gorro de Papá Noel dibujado a mano en SVG (04-nov-2026, modo navideño).
 *
 * Va ENCIMA del círculo de Hana, ladeado, como si lo llevara puesto. Es SVG y
 * no una imagen: se ve nítido a cualquier tamaño (el círculo grande de 80 px y
 * el avatar de 32 px del chat) y no pesa nada.
 *
 * El rojo sale del vino de la marca (#772125) aclarado hacia arriba, para que
 * se vea navideño sin desentonar con el azul del portal. La punta cae hacia la
 * derecha con el pompón, que se mece suave (ver .gorro-navideno en index.css).
 *
 * `useId`: cada gorro necesita ids de degradado propios; con ids fijos, dos
 * gorros en pantalla (botón y avatar del chat) se pisarían los degradados.
 */
export default function GorroNavideno({
  className = '',
  style,
}: {
  className?: string;
  /** Para posicionarlo en % sobre otra imagen (el logo del login). */
  style?: CSSProperties;
}) {
  const id = useId().replace(/:/g, '');
  const rojo = `gorro-rojo-${id}`;
  const brillo = `gorro-brillo-${id}`;
  const piel = `gorro-piel-${id}`;

  return (
    <svg viewBox="0 0 100 82" className={className} style={style} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={rojo} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor="#d4474d" />
          <stop offset="0.55" stopColor="#a8323a" />
          <stop offset="1" stopColor="#772125" />
        </linearGradient>
        <linearGradient id={brillo} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={piel} cx="0.35" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.7" stopColor="#f1f5f8" />
          <stop offset="1" stopColor="#d9e4ea" />
        </radialGradient>
      </defs>

      {/* Sombra suave que el gorro deja sobre el círculo */}
      <ellipse cx="50" cy="73" rx="40" ry="6" fill="#142831" opacity="0.18" />

      {/* Cuerpo: sube desde la base, hace la punta y cae hacia la derecha */}
      <path
        d="M17 64 C 20 40, 34 15, 57 8 C 73 3, 88 12, 91 33 L 84 36 C 81 24, 74 19, 66 22 C 73 33, 80 48, 85 64 Z"
        fill={`url(#${rojo})`}
      />
      {/* Brillo lateral para darle volumen */}
      <path d="M30 58 C 33 40, 42 24, 55 15" stroke={`url(#${brillo})`} strokeWidth="7" strokeLinecap="round" fill="none" />
      {/* Pliegue donde la punta se dobla */}
      <path d="M66 22 C 70 20, 76 20, 81 26" stroke="#5e1a1e" strokeOpacity="0.35" strokeWidth="1.6" fill="none" strokeLinecap="round" />

      {/* Ribete de piel blanca */}
      <rect x="9" y="58" width="84" height="17" rx="8.5" fill={`url(#${piel})`} />
      {[16, 26, 36, 46, 56, 66, 76, 86].map((x, i) => (
        <circle key={x} cx={x} cy={i % 2 === 0 ? 63 : 70} r="2.2" fill="#ffffff" opacity="0.9" />
      ))}

      {/* Pompón: se mece solo (clase en index.css) */}
      <g className="gorro-pompon" style={{ transformOrigin: '86px 36px' }}>
        <circle cx="88" cy="39" r="8.5" fill={`url(#${piel})`} />
        <circle cx="85.5" cy="36.5" r="2.6" fill="#ffffff" />
      </g>
    </svg>
  );
}
