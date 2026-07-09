import { Link } from 'react-router-dom';
import Logo from '../../../shared/components/Logo';
import Button from '../../../shared/components/Button';
import HeroCarousel from '../components/HeroCarousel';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-brand-900 flex flex-col">
      <header className="flex items-center justify-between px-8 py-6 md:px-16">
        <Logo className="h-10" variant="light" />
        <Link to="/login">
          <Button className="bg-brand-yellow text-brand-900 hover:bg-brand-yellow/90">Ingresar</Button>
        </Link>
      </header>

      <main className="flex-1 flex flex-col justify-center px-8 md:px-16 py-16">
        <HeroCarousel />
      </main>

      <footer className="px-8 md:px-16 py-6 text-xs text-white/40 border-t border-white/10">
        © {new Date().getFullYear()} Hanaska. Todos los derechos reservados.
      </footer>
    </div>
  );
}