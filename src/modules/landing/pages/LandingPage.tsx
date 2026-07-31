import { Link } from 'react-router-dom';
import Logo from '../../../shared/components/Logo';
import Button from '../../../shared/components/Button';
import HeroCarousel from '../components/HeroCarousel';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-brand-900">
      <header className="sticky top-0 z-10 bg-brand-900 border-b border-white/10">
        <div className="flex items-center justify-between px-8 md:px-16 py-4">
          <Logo className="h-12" variant="light" />
          <div className="flex items-center gap-6">
            <a
              href="mailto:contacto@hanaska.com"
              className="hidden sm:inline text-sm font-medium text-white/70 hover:text-white transition-colors"
            >
              Contacto
            </a>
            <Link to="/login">
              <Button className="!bg-brand-yellow !text-brand-900 hover:!bg-brand-yellow/90">Ingresar</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* El hero ahora ocupa toda la pantalla disponible (antes era un
          bloque centrado con padding, dejando el video chico a un
          costado) -> HeroCarousel se encarga de que el video/imagen
          cubra esto entero, con el texto superpuesto encima. */}
      <main className="flex-1 relative min-h-[600px] overflow-hidden bg-brand-900">
        <HeroCarousel />
      </main>

      <footer className="px-8 md:px-16 py-6 text-xs text-white/40 border-t border-white/10 bg-brand-900">
        © {new Date().getFullYear()} Hanaska. Todos los derechos reservados.
      </footer>
    </div>
  );
}