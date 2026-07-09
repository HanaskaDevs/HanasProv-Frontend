import { Link } from 'react-router-dom';
import Logo from '../../../shared/components/Logo';
import Button from '../../../shared/components/Button';
import HeroCarousel from '../components/HeroCarousel';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-200/40 via-white to-white flex flex-col">
      <header className="flex items-center justify-between px-8 py-6 md:px-16">
        <Logo className="h-14" variant="dark" />
        <Link to="/login">
          <Button>Ingresar</Button>
        </Link>
      </header>

      <main className="flex-1 flex flex-col justify-center px-8 md:px-16 py-16">
        <HeroCarousel />
      </main>

      <footer className="px-8 md:px-16 py-6 text-xs text-brand-900/40 border-t border-brand-900/10">
        © {new Date().getFullYear()} Hanaska. Todos los derechos reservados.
      </footer>
    </div>
  );
}