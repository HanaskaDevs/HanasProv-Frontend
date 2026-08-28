import type { EstadoHorario } from '../types';
import { ESTADOS_HORARIO } from '../types';

// Colores pedidos explícitamente por el usuario (26-ago-2026): Rechazado
// ROJO, Atrasado NARANJA, Arribo AZUL, En_Recepcion VERDE OSCURO, Recibido
// VERDE CLARO. Programado se queda neutro (todavía no pasó nada).
const ESTILOS: Record<EstadoHorario, string> = {
  Programado: 'bg-brand-900/8 text-brand-900/50',
  Atrasado: 'bg-orange-100 text-orange-700',
  Rechazado: 'bg-red-100 text-red-700',
  Arribo: 'bg-sky-100 text-sky-700',
  En_Recepcion: 'bg-emerald-800/15 text-emerald-900',
  Recibido: 'bg-emerald-100 text-emerald-700',
};

export default function BadgeEstadoHorario({ estado }: { estado: EstadoHorario }) {
  return (
    <span className={`text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full whitespace-nowrap ${ESTILOS[estado]}`}>
      {ESTADOS_HORARIO[estado].etiqueta}
    </span>
  );
}
