import { type ReactNode } from 'react';
import LogoLink from '../components/LogoLink';

export default function AuthLayout({ title, subtitle, children }: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      {/* Fondo */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/hanaska.jpg')" }}
      >
        <div className="absolute inset-0 bg-brand-900/60" />
      </div>

      <div className="relative w-full max-w-sm mx-4 rounded-2xl border border-white/15 bg-white/3 backdrop-blur-sm shadow-2xl p-8">
        <div className="flex justify-center mb-6">
          <LogoLink className="h-14" variant="light" />
        </div>
        <h1 className="font-display text-xl font-semibold text-white mb-1 text-center">{title}</h1>
        {subtitle && <p className="text-sm text-white/70 mb-6 text-center">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}