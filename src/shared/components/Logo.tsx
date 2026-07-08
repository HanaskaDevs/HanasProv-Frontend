import logo from '../../assets/logo-hanaska.png';

interface LogoProps {
  className?: string;
  /** "dark" = logo tal cual (para fondos claros). "light" = logo en blanco (para fondos oscuros como brand-900). */
  variant?: 'dark' | 'light';
}

export default function Logo({ className = 'h-10', variant = 'dark' }: LogoProps) {
  return (
    <img
      src={logo}
      alt="Hanaska"
      className={`${className} ${variant === 'light' ? 'brightness-0 invert' : ''}`}
    />
  );
}
