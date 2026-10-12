import { type ReactNode } from 'react';

interface BadgeProps {
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'amber';
  children: ReactNode;
  className?: string;
}

const toneClasses: Record<string, string> = {
  neutral: 'bg-brand-900/8 text-brand-900',
  success: 'bg-emerald-100 text-emerald-800',
  warning: 'bg-brand-yellow/30 text-brand-900',
  danger: 'bg-brand-wine/10 text-brand-wine',
  info: 'bg-brand-200 text-brand-700',
  // Mismo color que "Rechazado" en Ficha Productos -> lo reservamos
  // para "necesita corrección", separado de "danger" (wine), que queda
  // solo para lo bloqueante/destructivo (eliminar, vencido).
  amber: 'bg-amber-100 text-amber-800',
};

export default function Badge({ tone = 'neutral', children, className = '' }: BadgeProps) {
  return (
    // whitespace-nowrap: una insignia partida en dos renglones ("Sin /
    // calificar", "Pendiente de / activar") deja de leerse como una
    // etiqueta y descuadra la fila entera. Son textos cortos por diseño.
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${toneClasses[tone]} ${className}`}>
      {children}
    </span>
  );
}