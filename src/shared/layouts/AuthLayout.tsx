import { type ReactNode, useEffect, useState } from 'react';
import LogoLink from '../components/LogoLink';
import { obtenerImagenLoginPublica } from '../api/publicConfigApi';

const IMAGEN_RESPALDO = '/hanaska.jpg';
const CACHE_KEY = 'hanaska_login_imagen_url';

export default function AuthLayout({ title, subtitle, children }: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const [imagenFondo, setImagenFondo] = useState(
    () => localStorage.getItem(CACHE_KEY) || IMAGEN_RESPALDO
  );

  useEffect(() => {
    obtenerImagenLoginPublica()
      .then((url) => {
        if (!url) return;

        const img = new Image();
        img.onload = () => {
          setImagenFondo(url);
          localStorage.setItem(CACHE_KEY, url);
        };
        img.src = url;
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-500"
        style={{ backgroundImage: `url('${imagenFondo}')` }}
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