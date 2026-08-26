// src/shared/components/Footer.tsx
import { Link } from 'react-router-dom';
import Logo from './Logo';
import { DATOS_EMPRESA, REDES_SOCIALES, RUTAS_LEGALES } from '../config/datosEmpresa';

/**
 * Footer del portal. Reescrito desde cero: no reutiliza nada del footer de
 * hanaska.com.
 *
 * DECISIONES QUE EXPLICAN LA FORMA QUE TIENE:
 *
 * 1. COMPACTO. Una sola fila en escritorio más una barra fina de copyright.
 *    El footer anterior usaba py-10 y en pantallas chicas se comía media
 *    pantalla.
 *
 * 2. SIN ASSETS EXTERNOS. El anterior traía la tira de certificaciones por
 *    hotlink desde el CDN del sitio corporativo: ataba el portal a que ese
 *    CDN siguiera vivo y le contaba a un tercero cada visita.
 *
 * 3. LOS ENLACES LEGALES SON INTERNOS. Antes apuntaban a hanaska.com. Ahora
 *    van a páginas del propio portal, públicas: quien tiene que poder leer
 *    la política es cualquiera cuyos datos se traten, incluido un proveedor
 *    que todavía no tiene cuenta.
 *
 * 4. EL CORREO DE PROTECCIÓN DE DATOS NO VA ACÁ. Vive en la política y en el
 *    formulario de derechos, que es donde tiene contexto. En el footer, al
 *    lado del correo de contacto general, solo generaba dudas sobre a cuál
 *    de los dos escribir.
 *
 * No lleva RUC ni razón social: el footer identifica al grupo con su marca, y
 * la identificación de la persona jurídica vive en la política de protección
 * de datos, que es donde la LOPDP la exige.
 */

function IconoRed({ nombre }: { nombre: string }) {
  const comun = {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.85,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  switch (nombre) {
    case 'YouTube':
      return (
        <svg {...comun}>
          <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.42a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.42 8.6.42 8.6.42s6.88 0 8.6-.42a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33Z" />
          <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
        </svg>
      );
    case 'LinkedIn':
      return (
        <svg {...comun}>
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6Z" />
          <rect x="2" y="9" width="4" height="12" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      );
    case 'Facebook':
      return (
        <svg {...comun}>
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3Z" />
        </svg>
      );
    default:
      return (
        <svg {...comun}>
          <rect x="2" y="2" width="20" height="20" rx="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37Z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      );
  }
}

/** Dato de contacto con su etiqueta arriba, en versalitas. */
function Contacto({
  etiqueta,
  children,
}: {
  etiqueta: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
        {etiqueta}
      </p>
      <p className="mt-1 text-[13.5px] leading-snug text-white/80">{children}</p>
    </div>
  );
}

export default function Footer() {
  const anio = new Date().getFullYear();

  return (
    <footer className="relative bg-brand-900 text-white/70">
      {/* Filo superior en degradado: separa el footer del contenido sin
          meter una franja de color que compita con la marca. */}
      <div
        aria-hidden="true"
        className="h-px w-full bg-gradient-to-r from-transparent via-brand-200/40 to-transparent"
      />

      <div className="max-w-6xl mx-auto px-6 md:px-10 py-7">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
          <Logo className="h-11 w-auto shrink-0" variant="light" />

          <div className="grid flex-1 grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-3">
            <Contacto etiqueta="Dirección">
              {DATOS_EMPRESA.direccion}
              <br />
              {DATOS_EMPRESA.ciudad} — {DATOS_EMPRESA.pais}
            </Contacto>

            <Contacto etiqueta="Teléfono">
              <a
                href={`tel:${DATOS_EMPRESA.telefonoEnlace}`}
                className="hover:text-white transition-colors"
              >
                {DATOS_EMPRESA.telefono}
              </a>
            </Contacto>

            <Contacto etiqueta="Contacto">
              <a
                href={`mailto:${DATOS_EMPRESA.email}`}
                className="hover:text-white transition-colors break-all"
              >
                {DATOS_EMPRESA.email}
              </a>
            </Contacto>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {REDES_SOCIALES.map(({ nombre, href }) => (
              <a
                key={nombre}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={nombre}
                className="h-9 w-9 rounded-lg bg-white/[0.06] flex items-center justify-center text-white/60
                  hover:bg-white/[0.13] hover:text-white transition-colors
                  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
              >
                <IconoRed nombre={nombre} />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-3.5 flex flex-col-reverse items-center gap-2.5 sm:flex-row sm:justify-between">
          <p className="text-[11.5px] text-white/35">
            © {anio} {DATOS_EMPRESA.marca} · Todos los derechos reservados
          </p>

          <nav aria-label="Enlaces legales" className="flex items-center gap-1 text-[12.5px]">
            <Link
              to={RUTAS_LEGALES.politicaDatos}
              className="px-1.5 py-0.5 text-white/55 hover:text-white transition-colors"
            >
              Protección de datos
            </Link>
            <span aria-hidden="true" className="text-white/20">
              ·
            </span>
            <Link
              to={RUTAS_LEGALES.formularioDerechos}
              className="px-1.5 py-0.5 text-white/55 hover:text-white transition-colors"
            >
              Atención de derechos
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
