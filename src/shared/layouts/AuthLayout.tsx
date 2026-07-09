import { type ReactNode } from 'react';
import LogoLink from '../components/LogoLink';

export default function AuthLayout({ title, subtitle, children }: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      {/* Fondo — reemplaza este div por una <img> o bg-[url('/ruta/foto.jpg')] cuando tengas la foto real */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-900 via-brand-700 to-brand-wine">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-brand-yellow/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-brand-200/30 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm mx-4 rounded-2xl border border-white/20 bg-white/15 backdrop-blur-xl shadow-2xl p-8">
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