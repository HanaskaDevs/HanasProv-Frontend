/**
 * 'YYYY-MM-DD' -> "17 de septiembre de 2026".
 *
 * Se arma la fecha con año/mes/día por separado y no con `new Date(texto)`:
 * un 'YYYY-MM-DD' pelado el navegador lo interpreta como UTC, y en Ecuador
 * (UTC-5) eso muestra el día ANTERIOR.
 */
export function formatearFechaLarga(fechaIso: string): string {
  const [anio, mes, dia] = fechaIso.split('-').map(Number);
  if (!anio || !mes || !dia) return fechaIso;

  return new Date(anio, mes - 1, dia).toLocaleDateString('es-EC', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
