// src/shared/utils/formatoPrecio.ts

/**
 * Cómo se escribe el precio de un producto (18-nov-2026).
 *
 * El precio admite hasta 4 decimales (Producto.Precio es DECIMAL(12,4) en el
 * backend, ver App\Shared\FormatoPrecio, que hace exactamente lo mismo del
 * otro lado). Está acá, en un solo lugar, porque el precio se pinta en seis
 * pantallas distintas y todas tienen que mostrar lo mismo.
 */

/** Decimales que admite el precio. */
export const DECIMALES_PRECIO = 4;

/** El `step` de un <input type="number"> de precio. */
export const PASO_PRECIO = '0.0001';

/**
 * El precio para MOSTRAR: siempre 2 decimales como mínimo y hasta 4 si los
 * tiene. 5 -> "5.00", "0.1275" -> "0.1275", "1.2500" -> "1.25".
 *
 * El backend manda el decimal como texto con sus 4 decimales ("5.0000");
 * pintarlo tal cual llenaría las listas de ceros que no dicen nada. Así los
 * precios de siempre se siguen leyendo igual y solo crecen los que de verdad
 * traen más precisión.
 *
 * Devuelve '' si no hay precio (o no es un número): quien lo use decide qué
 * poner en ese caso.
 */
export function formatearPrecio(precio: number | string | null | undefined): string {
  if (precio === null || precio === undefined || precio === '') return '';

  const numero = Number(precio);
  if (Number.isNaN(numero)) return '';

  // Quita hasta dos ceros finales: de 4 decimales baja como mucho a 2.
  return numero.toFixed(DECIMALES_PRECIO).replace(/0{1,2}$/, '');
}

/** ¿El número tiene como mucho 4 decimales? Para validar lo que se escribe. */
export function tieneDecimalesDePrecio(valor: number): boolean {
  // Se compara redondeando y no contando caracteres: 0.1 + 0.2 no tiene 17
  // decimales "de verdad", es ruido de coma flotante.
  const escala = 10 ** DECIMALES_PRECIO;
  return Math.abs(Math.round(valor * escala) - valor * escala) < 1e-6;
}
