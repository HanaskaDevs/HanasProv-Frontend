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
  const [imagenActual, setImagenActual] = useState(
    () => localStorage.getItem(CACHE_KEY) || IMAGEN_RESPALDO
  );
  // Capa nueva por separado (en vez de reemplazar imagenActual directo)
  // -> así se puede montar por encima con opacity:0 -> 1 y lograr un
  // crossfade real, en vez de un corte seco al cambiar el fondo.
  const [imagenNueva, setImagenNueva] = useState<string | null>(null);

  useEffect(() => {
    obtenerImagenLoginPublica()
      .then((url) => {
        if (!url || url === imagenActual) return;

        const img = new Image();
        img.onload = () => {
          setImagenNueva(url);
          localStorage.setItem(CACHE_KEY, url);
        };
        img.src = url;
      })
      .catch(() => {});
    // Solo en el montaje -> imagenActual de esta primera carga viene del
    // caché local, no hace falta re-disparar si cambiara después.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${imagenActual}')` }} />
      {imagenNueva && (
        <div
          key={imagenNueva}
          className="absolute inset-0 bg-cover bg-center animar-fondo-login"
          style={{ backgroundImage: `url('${imagenNueva}')` }}
          onAnimationEnd={() => {
            setImagenActual(imagenNueva);
            setImagenNueva(null);
          }}
        />
      )}

      {/* Degradado con más profundidad que un overlay plano -> más oscuro
          en las esquinas para que la tarjeta central respire, con un
          toque sutil del dorado de marca en la esquina superior. */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-900/75 via-brand-900/55 to-brand-900/80" />
      <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-brand-yellow/10 blur-3xl pointer-events-none" />

      <div className="animar-tarjeta-login relative w-full max-w-sm mx-4 p-8">
        {/* Sin tarjeta, el contraste ya no lo da un fondo sólido -> se
            compensa con text-shadow en el texto (label, título) para
            que siga siendo legible sobre cualquier parte de la foto,
            sin importar qué tan clara u oscura sea justo ahí. */}

        <div className="flex justify-center mb-6">
          <LogoLink className="h-24" variant="light" />
        </div>
        <h1
          className="font-display text-xl font-semibold text-white mb-1 text-center"
          style={{ textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-white/80 mb-6 text-center" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}>
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}