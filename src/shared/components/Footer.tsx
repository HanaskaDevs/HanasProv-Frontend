// src/shared/components/Footer.tsx
import Logo from './Logo';

function IconoYoutube({ className = '' }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.42a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.42 8.6.42 8.6.42s6.88 0 8.6-.42a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33Z" />
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
    </svg>
  );
}

function IconoLinkedin({ className = '' }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6Z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function IconoFacebook({ className = '' }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3Z" />
    </svg>
  );
}

function IconoInstagram({ className = '' }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37Z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

const REDES = [
  { icono: IconoYoutube, href: 'https://www.youtube.com/@hanaska5854', label: 'YouTube' },
  { icono: IconoLinkedin, href: 'https://www.linkedin.com/company/hanaska/', label: 'LinkedIn' },
  { icono: IconoFacebook, href: 'https://www.facebook.com/hanaskagrupo', label: 'Facebook' },
  { icono: IconoInstagram, href: 'https://www.instagram.com/grupohanaska/', label: 'Instagram' },
];

/**
 * Mismo estilo que el footer de hanaska.com, adaptado al Portal de
 * Proveedores -> sin los links internos (Intranet, Hanasnet,
 * Hanaslearning, no aplican acá) y con el copyright propio del portal
 * en vez de créditos de la agencia que armó el sitio corporativo.
 *
 * Las certificaciones (ISO 22000, HACCP, etc.) del sitio original NO
 * se reprodujeron acá a propósito -> son sellos oficiales de
 * organismos certificadores, y no tenemos los archivos reales para
 * mostrarlos correctamente.
 */
export default function Footer() {
  return (
    <footer className="bg-brand-900 text-white/70">
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <Logo className="h-14" variant="light" />
          <p className="text-sm text-white/60 mt-4">
            Isaac Albéniz E3-78 y Mozart
            <br />
            Quito-Ecuador
          </p>
        </div>

        <div>
          <img
            src="https://lirp.cdn-website.com/04784783/dms3rep/multi/opt/footer-certificados-v2-8ebb6c60-1920w.png"
            alt="Certificaciones Hanaska: ICONTEC ISO 22000, ICONTEC HACCP, IQNet, BPM, GCR, Kosher"
            className="h-14 w-auto mb-4"
            loading="lazy"
          />
          <p className="text-sm text-white leading-relaxed">
            Trabajamos juntos en soluciones que impulsan tu operación.
          </p>
          <div className="flex items-center gap-3 mt-4">
            {REDES.map(({ icono: Icono, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="h-8 w-8 rounded-full border border-white/25 flex items-center justify-center text-white/70 hover:text-white hover:border-white/50 transition-colors"
              >
                <Icono />
              </a>
            ))}
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <a href="https://www.hanaska.com/politica-de-proteccion-de-datos" target="_blank" rel="noreferrer" className="block hover:text-white transition-colors">
            Política de protección de datos
          </a>
          <a href="https://www.hanaska.com/formulario-atencion-de-derechos" target="_blank" rel="noreferrer" className="block hover:text-white transition-colors">
            Formulario atención de derechos
          </a>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-4 text-xs text-white/40 text-center">
          © {new Date().getFullYear()} Hanaska · Portal Proveedores
        </div>
      </div>
    </footer>
  );
}