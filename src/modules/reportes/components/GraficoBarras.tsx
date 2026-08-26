// src/modules/reportes/components/GraficoBarras.tsx
import { useState } from 'react';

export interface BarraDato {
  etiqueta: string;
  /** 0 a 100. */
  valor: number;
  /** Texto chico para el tooltip (RUC, cantidad de pedidos, etc.). */
  detalle?: string;
}

/**
 * Gráfico de barras verticales en SVG: eje Y con escala, rejilla, valor
 * encima de cada barra y línea de referencia.
 *
 * HECHO A MANO Y NO CON LIBRERÍA. Recharts o Chart.js pesan ~100 KB
 * comprimidos y el paquete del portal ya carga 412 KB más 424 KB de xlsx. Un
 * gráfico de barras son rectángulos y texto en coordenadas: no justifica esa
 * dependencia.
 *
 * UNA SOLA SERIE, UN SOLO TONO. Todas las barras miden lo mismo (el fill
 * rate) y lo que las diferencia es su ALTURA, no su color. Pintar cada
 * proveedor de un color distinto agregaría una dimensión que no existe, y con
 * más de ocho proveedores obligaría a repetir colores. Por eso tampoco lleva
 * leyenda: con una sola serie, el título ya dice qué se mide.
 *
 * VERTICALES: es la orientación que la gente reconoce como "gráfico de
 * barras". Los nombres de proveedor son largos, así que se recortan y el
 * nombre completo aparece en el tooltip al pasar el mouse.
 */
export default function GraficoBarras({
  datos,
  referencia,
  etiquetaReferencia,
}: {
  datos: BarraDato[];
  /** Línea punteada de referencia (ej. la meta de fill rate). */
  referencia?: number;
  etiquetaReferencia?: string;
}) {
  const [encima, setEncima] = useState<number | null>(null);

  if (datos.length === 0) {
    return <p className="py-8 text-center text-sm text-brand-900/50">No hay datos para graficar.</p>;
  }

  // Geometría en PÍXELES REALES: el SVG se dibuja a escala 1:1 (ver el style
  // de más abajo), así que estos números son el tamaño final en pantalla.
  //
  // ESCALA DEL PORTAL. La versión anterior era demasiado grande: se dejaba
  // escalar hasta 1.4 veces el viewBox, y con el alto de 300 terminaba
  // ocupando unos 420 px de alto en cualquier pantalla, muy por encima del
  // radar (que va topado en 340) y de las tarjetas del panel. Ahora el alto
  // es fijo, del orden del resto de los bloques del portal, y lo que crece
  // con la cantidad de proveedores es el ancho, que el contenedor deja
  // desplazar.
  const alto = 212;
  const margenIzq = 32;
  const margenDer = 10;
  const margenArriba = 18;
  const margenAbajo = 46;

  const anchoBarra = 30;
  const separacion = 16;
  const anchoTrama = datos.length * anchoBarra + (datos.length - 1) * separacion;
  const ancho = margenIzq + anchoTrama + margenDer;

  const altoTrama = alto - margenArriba - margenAbajo;

  /** Y de un valor 0..100 dentro del área de trama. */
  const y = (valor: number) => margenArriba + altoTrama * (1 - Math.min(100, Math.max(0, valor)) / 100);

  const marcas = [0, 25, 50, 75, 100];

  return (
    <figure className="m-0">
      {/* Dos divs: el de afuera desplaza cuando hay muchos proveedores, el de
          adentro centra cuando hay pocos (con dos o tres barras el SVG mide
          menos que la tarjeta, y pegado a la izquierda se veía abandonado).
          min-w-fit evita que el centrado achique el contenido cuando no
          entra. */}
      <div className="overflow-x-auto">
        <div className="flex min-w-fit justify-center">
          <svg
            viewBox={`0 0 ${ancho} ${alto}`}
            // Tamaño exacto, sin escalar: con pocas barras el gráfico queda
            // chico en vez de estirarse para llenar el ancho de la tarjeta (dos
            // proveedores no justifican barras del tamaño de una mano), y con
            // muchas se desplaza dentro del contenedor en vez de crecer hacia
            // abajo.
            style={{ width: `${ancho}px`, height: `${alto}px` }}
            role="img"
            aria-label={`Fill rate por proveedor: ${datos.map((d) => `${d.etiqueta} ${d.valor.toFixed(1)}%`).join('; ')}`}
          >
            {/* Rejilla y eje Y. Recesivos a propósito: la rejilla ayuda a leer
                la altura, no compite con las barras. */}
            {marcas.map((marca) => (
              <g key={marca}>
                <line
                  x1={margenIzq}
                  y1={y(marca)}
                  x2={ancho - margenDer}
                  y2={y(marca)}
                  className={marca === 0 ? 'stroke-brand-900/25' : 'stroke-brand-900/10'}
                  strokeWidth="1"
                />
                <text
                  x={margenIzq - 8}
                  y={y(marca)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-brand-900/45 text-[10px] tabular-nums"
                >
                  {marca}%
                </text>
              </g>
            ))}

            {/* Línea de referencia (la meta). Punteada para que no se confunda
                con la rejilla ni con una barra. */}
            {referencia !== undefined && (
              <line
                x1={margenIzq}
                y1={y(referencia)}
                x2={ancho - margenDer}
                y2={y(referencia)}
                className="stroke-brand-wine/70"
                strokeWidth="1.5"
                strokeDasharray="5 4"
              />
            )}

            {datos.map((dato, i) => {
              const x = margenIzq + i * (anchoBarra + separacion);
              const yBarra = y(dato.valor);
              const altoBarra = Math.max(1, alto - margenAbajo - yBarra);
              const resaltada = encima === i;

              return (
                <g
                  key={dato.etiqueta}
                  onMouseEnter={() => setEncima(i)}
                  onMouseLeave={() => setEncima(null)}
                  onFocus={() => setEncima(i)}
                  onBlur={() => setEncima(null)}
                  tabIndex={0}
                  className="focus:outline-none"
                >
                  {/* Zona de captura más ancha que la barra: acertarle a una
                      barra de 30 px con el mouse no debería ser un ejercicio de
                      precisión. */}
                  <rect
                    x={x - separacion / 2}
                    y={margenArriba}
                    width={anchoBarra + separacion}
                    height={altoTrama}
                    fill="transparent"
                  />

                  {/* La barra. Esquinas superiores redondeadas y base anclada al
                      eje: el redondeo va solo arriba, donde está el dato. */}
                  <path
                    d={barraRedondeada(x, yBarra, anchoBarra, altoBarra, 4)}
                    className={resaltada ? 'fill-brand-900' : 'fill-brand-700'}
                    style={{ transition: 'fill 150ms' }}
                  />

                  {/* Valor encima de la barra: con la etiqueta directa el lector
                      no tiene que medir la altura contra la rejilla. */}
                  <text
                    x={x + anchoBarra / 2}
                    y={yBarra - 6}
                    textAnchor="middle"
                    className="fill-brand-900 text-[10px] font-semibold tabular-nums"
                  >
                    {dato.valor.toFixed(1)}%
                  </text>

                  {/* Nombre del proveedor. Se recorta acá y el completo va en el
                      tooltip; rotarlo 45° lo haría ilegible igual. */}
                  <text
                    x={x + anchoBarra / 2}
                    y={alto - margenAbajo + 13}
                    textAnchor="middle"
                    className="fill-brand-900/65 text-[9px]"
                  >
                    {recortar(dato.etiqueta, 10)}
                  </text>

                  {resaltada && (
                    <text
                      x={x + anchoBarra / 2}
                      y={alto - margenAbajo + 26}
                      textAnchor="middle"
                      className="fill-brand-900 text-[8.5px] font-medium"
                    >
                      {recortar(dato.etiqueta, 22)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {referencia !== undefined && (
        <figcaption className="mt-2 flex items-center gap-2 text-[12px] text-brand-900/55">
          <span aria-hidden="true" className="inline-block w-5 border-t-2 border-dashed border-brand-wine/70" />
          {etiquetaReferencia ?? `Referencia: ${referencia}%`}
        </figcaption>
      )}

      {/* Tabla del mismo dato: es la vista accesible y además resuelve el
          caso de los nombres recortados en el eje. */}
      <details className="mt-3">
        <summary className="cursor-pointer text-[12.5px] text-brand-700 hover:underline">
          Ver los datos en tabla
        </summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-brand-900/12 text-left">
                <th className="py-1.5 pr-3 font-medium text-brand-900/60">Proveedor</th>
                <th className="py-1.5 pr-3 font-medium text-brand-900/60">Fill rate</th>
                <th className="py-1.5 font-medium text-brand-900/60">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((dato) => (
                <tr key={dato.etiqueta} className="border-b border-brand-900/6">
                  <td className="py-1.5 pr-3 text-brand-900">{dato.etiqueta}</td>
                  <td className="py-1.5 pr-3 font-medium tabular-nums text-brand-900">
                    {dato.valor.toFixed(1)}%
                  </td>
                  <td className="py-1.5 text-brand-900/55">{dato.detalle ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

/**
 * Rectángulo con las dos esquinas de ARRIBA redondeadas. Un `rect` con `rx`
 * redondea las cuatro, y la base de una barra tiene que quedar plana contra
 * el eje: si se redondea, la barra parece flotar.
 */
function barraRedondeada(x: number, y: number, ancho: number, alto: number, radio: number): string {
  const r = Math.min(radio, ancho / 2, alto);

  return [
    `M ${x} ${y + alto}`,
    `L ${x} ${y + r}`,
    `Q ${x} ${y} ${x + r} ${y}`,
    `L ${x + ancho - r} ${y}`,
    `Q ${x + ancho} ${y} ${x + ancho} ${y + r}`,
    `L ${x + ancho} ${y + alto}`,
    'Z',
  ].join(' ');
}

function recortar(texto: string, maximo: number): string {
  return texto.length <= maximo ? texto : `${texto.slice(0, maximo - 1)}…`;
}
