/**
 * Texto que ve el proveedor si intenta enviar la ficha a revisión sin
 * marcar la casilla de las Políticas de Hanaska. Vive aparte (y no en un
 * componente) para que lo compartan los tres formularios del wizard sin
 * romper el Fast Refresh de Vite, que exige que los archivos de componentes
 * exporten solo componentes.
 */
export const MENSAJE_POLITICAS_REQUERIDAS =
  'Debe aceptar las Políticas de Hanaska para enviar su ficha a revisión.';
