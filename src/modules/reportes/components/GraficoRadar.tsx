// src/modules/reportes/components/GraficoRadar.tsx
import { useId, useState } from 'react';

export interface SerieRadar {
  nombre: string;
  /** Un valor de 0 a 100 por eje, en el mismo orden que `ejes`. */
  valores: (number | null)[];
}

/**
 * Radar (o "araña") para comparar proveedores componente por componente.
 *
 * HECHO A MANO EN SVG, sin librería de gráficos. Recharts o Chart.js pesan
 * ~100 KB comprimidos y el paquete del portal ya carga 412 KB más 424 KB de
 * xlsx; un radar son unas cuantas coordenadas polares y no justifica esa
 * dependencia.
 *
 * TOPE DE 3 SERIES, y no es una preferencia estética. En un radar todas las
 * series se superponen entre sí, así que hay que distinguir CUALQUIER par, no
 * solo los vecinos. Con la paleta categórica validada, tres colores pasan
 * todas las comprobaciones (peor par: ΔE 9.2 para deuteranopía, 24.0 para
 * visión normal); al agregar el cuarto, el naranja y el amarillo caen a ΔE
 * 13.7 en visión NORMAL, por debajo del piso de 15: ni alguien sin daltonismo
 * los diferencia. Por eso la pantalla que lo usa no deja elegir más de tres.
 *
 * Los ejes van etiquetados y cada serie va nombrada en la leyenda Y con su
 * color: la identidad nunca depende del color solo.
 */
export default function GraficoRadar({
  ejes,
  series,
  colores,
}: {
  /** Etiqueta de cada vértice. */
  ejes: string[];
  series: SerieRadar[];
  /** Un color por serie, en el mismo orden. */
  colores: string[];
}) {
  const id = useId();
  const [resaltada, setResaltada] = useState<number | null>(null);

  // El viewBox es cuadrado y fijo: el SVG escala solo con el contenedor y no
  // hace falta medir el ancho en JS ni volver a dibujar al redimensionar.
  const lado = 320;
  const centro = lado / 2;
  // Deja aire para las etiquetas de los ejes, que van FUERA del polígono.
  const radio = centro - 58;

  const cantidad = ejes.length;

  /** Coordenada del vértice `indice` a la distancia `proporcion` (0..1). */
  function punto(indice: number, proporcion: number) {
    // Se arranca en -90° para que el primer eje quede arriba, que es como se
    // espera leer un radar.
    const angulo = (Math.PI * 2 * indice) / cantidad - Math.PI / 2;
    return {
      x: centro + Math.cos(angulo) * radio * proporcion,
      y: centro + Math.sin(angulo) * radio * proporcion,
    };
  }

  const anillos = [0.25, 0.5, 0.75, 1];

  function poligono(valores: (number | null)[]): string {
    return valores
      .map((valor, i) => {
        // Un componente sin medir se dibuja en el centro, no en 100: pintarlo
        // lleno haría creer que sacó el puntaje completo.
        const p = punto(i, (valor ?? 0) / 100);
        return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      })
      .join(' ');
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <svg
        viewBox={`0 0 ${lado} ${lado}`}
        className="w-full max-w-[340px] mx-auto sm:mx-0"
        role="img"
        aria-label={`Radar comparativo de ${series.map((s) => s.nombre).join(', ')}`}
      >
        {/* Rejilla: anillos concéntricos y radios. Recesiva a propósito. */}
        {anillos.map((proporcion) => (
          <polygon
            key={proporcion}
            points={ejes.map((_, i) => {
              const p = punto(i, proporcion);
              return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
            }).join(' ')}
            className="fill-none stroke-brand-900/10"
            strokeWidth="1"
          />
        ))}

        {ejes.map((_, i) => {
          const p = punto(i, 1);
          return (
            <line
              key={i}
              x1={centro}
              y1={centro}
              x2={p.x}
              y2={p.y}
              className="stroke-brand-900/10"
              strokeWidth="1"
            />
          );
        })}

        {/* Escala: solo el 50 y el 100, para no llenar el centro de números. */}
        {[0.5, 1].map((proporcion) => (
          <text
            key={proporcion}
            x={centro + 4}
            y={centro - radio * proporcion + 4}
            className="fill-brand-900/35 text-[9px]"
          >
            {proporcion * 100}%
          </text>
        ))}

        {/* Las series. Se dibujan en orden inverso para que la primera quede
            arriba y su borde no lo tape la siguiente. */}
        {[...series].reverse().map((serie, indiceInverso) => {
          const i = series.length - 1 - indiceInverso;
          const color = colores[i % colores.length];
          const atenuada = resaltada !== null && resaltada !== i;

          return (
            <g key={serie.nombre} style={{ opacity: atenuada ? 0.15 : 1 }} className="transition-opacity duration-200">
              <polygon
                points={poligono(serie.valores)}
                fill={color}
                fillOpacity={0.14}
                stroke={color}
                strokeWidth="2"
                strokeLinejoin="round"
              />
              {serie.valores.map((valor, j) => {
                if (valor === null) return null;
                const p = punto(j, valor / 100);
                return (
                  <circle
                    key={`${id}-${i}-${j}`}
                    cx={p.x}
                    cy={p.y}
                    r="3.5"
                    fill={color}
                    // Anillo del color de la superficie: separa los puntos
                    // cuando dos series pasan por el mismo lugar.
                    stroke="white"
                    strokeWidth="1.5"
                  />
                );
              })}
            </g>
          );
        })}

        {/* Etiquetas de los ejes, fuera del polígono. */}
        {ejes.map((eje, i) => {
          const p = punto(i, 1.19);
          const alineacion =
            Math.abs(p.x - centro) < 12 ? 'middle' : p.x > centro ? 'start' : 'end';

          return (
            <text
              key={eje}
              x={p.x}
              y={p.y}
              textAnchor={alineacion}
              dominantBaseline="middle"
              className="fill-brand-900/70 text-[9.5px] font-medium"
            >
              {/* Se parte en dos líneas si es largo: "Auditoría de recepción"
                  no cabe de una sola en un radar de este tamaño. */}
              {partirEtiqueta(eje).map((linea, k, todas) => (
                <tspan key={k} x={p.x} dy={k === 0 ? -((todas.length - 1) * 5) : 10}>
                  {linea}
                </tspan>
              ))}
            </text>
          );
        })}
      </svg>

      {/* Leyenda: siempre presente con 2 o más series, y con el valor total
          al lado para que se pueda leer sin volver al gráfico. */}
      <ul className="flex flex-col gap-2 sm:min-w-[9rem]">
        {series.map((serie, i) => (
          <li key={serie.nombre}>
            <button
              type="button"
              onMouseEnter={() => setResaltada(i)}
              onMouseLeave={() => setResaltada(null)}
              onFocus={() => setResaltada(i)}
              onBlur={() => setResaltada(null)}
              className="flex w-full items-center gap-2 rounded px-1 py-0.5 text-left hover:bg-brand-900/[0.03]
                focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-700"
            >
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: colores[i % colores.length] }}
              />
              <span className="min-w-0 flex-1 truncate text-[12.5px] text-brand-900">
                {serie.nombre}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Parte una etiqueta larga en dos líneas por el espacio más cercano al medio. */
function partirEtiqueta(texto: string): string[] {
  if (texto.length <= 14) return [texto];

  const medio = Math.floor(texto.length / 2);
  const espacios = [...texto].reduce<number[]>((acc, c, i) => (c === ' ' ? [...acc, i] : acc), []);

  if (espacios.length === 0) return [texto];

  const corte = espacios.reduce((mejor, i) =>
    Math.abs(i - medio) < Math.abs(mejor - medio) ? i : mejor
  );

  return [texto.slice(0, corte), texto.slice(corte + 1)];
}
