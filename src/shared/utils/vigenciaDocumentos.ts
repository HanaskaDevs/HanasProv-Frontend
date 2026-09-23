/**
 * Regla de vigencia de los documentos que caducan (23-sep-2026).
 *
 * UN MES MÍNIMO. No es un capricho: el ciclo de avisos por correo empieza
 * 30 días antes del vencimiento (VencimientoDocumentosService::
 * DIAS_PRIMER_AVISO en el backend). Un documento que entra con menos de
 * eso nace disparando el aviso de "por vencer" el mismo día que se carga.
 *
 * Antes no se validaba nada y se podía subir un certificado con fecha del
 * año pasado: pasó de verdad, uno con caducidad 2026-01-25 cargado en
 * septiembre. El backend ahora lo rechaza; esto es para que el calendario
 * del navegador ni siquiera ofrezca esas fechas.
 */

/** Meses de vigencia que se exigen como mínimo. Igual que en el backend. */
const MESES_MINIMOS = 1;

/**
 * Primera fecha aceptable, en el formato YYYY-MM-DD que espera el atributo
 * `min` de un <input type="date">.
 */
export function fechaCaducidadMinima(): string {
  const minima = new Date();
  minima.setMonth(minima.getMonth() + MESES_MINIMOS);

  // toISOString() pasa por UTC y en nuestra zona (UTC-5) retrocede un día.
  // Se arma a mano con los componentes locales.
  const anio = minima.getFullYear();
  const mes = String(minima.getMonth() + 1).padStart(2, '0');
  const dia = String(minima.getDate()).padStart(2, '0');

  return `${anio}-${mes}-${dia}`;
}

/** El mismo dato en palabras, para el texto de ayuda del campo. */
export function textoVigenciaMinima(): string {
  const [anio, mes, dia] = fechaCaducidadMinima().split('-');

  return `Debe vencer del ${dia}/${mes}/${anio} en adelante (mínimo un mes de vigencia).`;
}
