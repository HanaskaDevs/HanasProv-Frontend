import { type ReactNode } from 'react';

export default function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-brand-900/8 bg-white p-6 shadow-sm ${className}`}>
      {children}
    </div>
  );
}
