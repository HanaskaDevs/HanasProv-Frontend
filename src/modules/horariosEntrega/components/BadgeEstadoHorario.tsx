import type { EstadoHorario } from '../types';
import { ESTADOS_HORARIO } from '../types';

const ESTILOS: Record<EstadoHorario, string> = {
  Programado: 'bg-brand-900/8 text-brand-900/50',
  Atrasado: 'bg-brand-wine/15 text-brand-wine',
  En_Arribo: 'bg-sky-100 text-sky-700',
  En_Recepcion: 'bg-amber-100 text-amber-700',
  Entregado: 'bg-emerald-100 text-emerald-700',
};

export default function BadgeEstadoHorario({ estado }: { estado: EstadoHorario }) {
  return (
    <span className={`text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full whitespace-nowrap ${ESTILOS[estado]}`}>
      {ESTADOS_HORARIO[estado].etiqueta}
    </span>
  );
}
