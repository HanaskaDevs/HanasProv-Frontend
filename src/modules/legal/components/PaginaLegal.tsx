// src/modules/legal/components/PaginaLegal.tsx
import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../../../shared/components/Logo';
import Footer from '../../../shared/components/Footer';

/**
 * Envoltura de las páginas legales (política de datos y formulario de
 * derechos).
 *
 * Son PÚBLICAS a propósito, fuera de ProtectedRoute: la LOPDP exige que el
 * titular pueda conocer la política y ejercer sus derechos, y eso incluye a
 * un proveedor que todavía no tiene cuenta o a uno al que ya se le
 * desactivó. Si vivieran detrás del login, justamente quien más necesita
 * ejercer el derecho de eliminación no podría leerlas.
 */
export default function PaginaLegal({
  titulo,
  bajada,
  children,
}: {
  titulo: string;
  bajada?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="border-b border-brand-900/8 bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
          <Link to="/" aria-label="Ir al inicio">
            <Logo className="h-8 w-auto" />
          </Link>
          <Link
            to="/"
            className="text-sm text-brand-900/60 hover:text-brand-900 transition-colors whitespace-nowrap"
          >
            Volver al inicio
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-6 py-10 md:py-14">
          <h1 className="font-display text-2xl md:text-3xl font-semibold text-brand-900 text-balance">
            {titulo}
          </h1>
          {bajada && <p className="mt-3 text-brand-900/60 leading-relaxed">{bajada}</p>}

          <div className="mt-8 md:mt-10">{children}</div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

/**
 * Sección numerada de un documento legal. El número va en el markup y no
 * como lista automática porque las secciones se citan por número ("ver
 * apartado 8") y tienen que poder enlazarse: cada una lleva su propio id.
 */
export function SeccionLegal({
  numero,
  titulo,
  children,
}: {
  numero: number;
  titulo: string;
  children: ReactNode;
}) {
  const id = `seccion-${numero}`;

  return (
    <section id={id} className="scroll-mt-20 border-t border-brand-900/8 pt-7 mt-7 first:border-t-0 first:pt-0 first:mt-0">
      <h2 className="font-display text-lg font-semibold text-brand-900 flex gap-2.5 text-balance">
        <span className="text-brand-700/70 tabular-nums">{numero}.</span>
        <span>{titulo}</span>
      </h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-brand-900/80">{children}</div>
    </section>
  );
}

/** Lista con viñetas, con el espaciado del documento. */
export function ListaLegal({ children }: { children: ReactNode }) {
  return <ul className="space-y-2 pl-5 list-disc marker:text-brand-700/50">{children}</ul>;
}

/**
 * Bloque destacado para lo que el titular no debería pasar por alto (sus
 * derechos, el canal de contacto, las decisiones automatizadas). En un
 * documento legal largo, lo importante se pierde si todo se ve igual.
 */
export function DestacadoLegal({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-brand-200 bg-brand-200/15 px-4 py-3.5 text-[15px] leading-relaxed text-brand-900/85">
      {children}
    </div>
  );
}
