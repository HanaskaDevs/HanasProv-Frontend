/**
 * Marca de un pedido fuera de planificación (19-nov-2026): turno suelto de
 * esta semana agendado en Business Central, no un horario del calendario
 * semanal. Tiene 10 min de tolerancia y no admite solicitud de aprobación,
 * así que conviene que el Guardia lo distinga de un vistazo.
 *
 * 'tv': versión para el fondo oscuro del Modo TV.
 */
export default function EtiquetaFueraPlanificacion({ variante = 'normal' }: { variante?: 'normal' | 'tv' }) {
  const clases =
    variante === 'tv'
      ? 'text-xs px-2 py-0.5 bg-violet-400 text-brand-900'
      : 'text-[10px] px-1.5 py-0.5 bg-violet-100 text-violet-800';

  return (
    <span className={`inline-block align-middle font-semibold uppercase tracking-wide rounded whitespace-nowrap ${clases}`}>
      Fuera de planificación
    </span>
  );
}
