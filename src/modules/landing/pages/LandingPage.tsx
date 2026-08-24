import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../../../shared/components/Logo';
import Button from '../../../shared/components/Button';
import Footer from '../../../shared/components/Footer';
import HeroCarousel from '../components/HeroCarousel';

export default function LandingPage() {
  const [conScroll, setConScroll] = useState(false);

  useEffect(() => {
    // Mismos dos umbrales que en DashboardLayout, por el mismo motivo:
    // evitar que la animación oscile en bucle justo en el borde.
    function alScrollear() {
      setConScroll((actual) => (actual ? window.scrollY > 8 : window.scrollY > 40));
    }
    window.addEventListener('scroll', alScrollear);
    return () => window.removeEventListener('scroll', alScrollear);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-brand-900">
      <header className="sticky top-0 z-10 bg-brand-900 border-b border-white/10 transition-all duration-300">
        <div className={`flex items-center justify-between px-8 md:px-16 transition-all duration-300 ${conScroll ? 'py-2' : 'py-4'}`}>
          <Logo className={`transition-all duration-300 ${conScroll ? 'h-9' : 'h-12'}`} variant="light" />
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
      {/* "isolate" crea su propio contexto de apilamiento (stacking
          context) para todo lo de adentro -> los z-10/z-20/z-30 que usa
          HeroCarousel para ordenar sus capas ENTRE ELLAS quedan
          encerrados acá, y no compiten con el z-10 del header de arriba.
          Sin esto, el header (sticky) terminaba tapado por el degradado/
          texto del carrusel al hacer scroll, porque esos z-index vivían
          en el mismo contexto global que el header. */}
      <main className="flex-1 relative isolate min-h-[600px] overflow-hidden bg-brand-900">
        <HeroCarousel />
      </main>

      <Footer />
    </div>
  );
}