import { type ReactNode } from 'react';

interface BadgeProps {
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  children: ReactNode;
}

const toneClasses: Record<string, string> = {
  neutral: 'bg-brand-900/8 text-brand-900',
  success: 'bg-emerald-100 text-emerald-800',
  warning: 'bg-brand-yellow/30 text-brand-900',
  danger: 'bg-brand-wine/10 text-brand-wine',
  info: 'bg-brand-200 text-brand-700',
};

export default function Badge({ tone = 'neutral', children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}
