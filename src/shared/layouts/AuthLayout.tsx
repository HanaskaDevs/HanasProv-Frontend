import { type ReactNode } from 'react';
import Logo from '../components/Logo';

export default function AuthLayout({ title, subtitle, children }: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-brand-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Logo className="h-14" variant="light" />
        </div>
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="font-display text-xl font-semibold text-brand-900 mb-1">{title}</h1>
          {subtitle && <p className="text-sm text-brand-900/60 mb-6">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}
