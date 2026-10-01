import { useEffect } from 'react';

/**
 * El video tutorial, centrado en la pantalla y sin salir del portal
 * (01-oct-2026).
 *
 * EL ENLACE "Abrir en YouTube" ESTÁ SIEMPRE, no solo cuando algo falla.
 * El iframe lo sirve youtube.com, y los filtros de red corporativos
 * (Check Point, en el caso de Hanaska) cortan ese dominio entre las
 * primeras categorías: el proveedor vería un recuadro negro sin saber por
 * qué. Detectar desde JavaScript que un iframe quedó bloqueado no es
 * confiable -la política de mismo origen impide mirar adentro, y el evento
 * 'load' dispara igual sobre una página de bloqueo-, así que en vez de
 * adivinar se deja la salida a la vista.
 */
export default function ModalVideoTutorial({
  urlEmbed,
  url,
  onCerrar,
}: {
  urlEmbed: string;
  url: string;
  onCerrar: () => void;
}) {
  // Escape cierra, como el resto de los modales del portal.
  useEffect(() => {
    function alPresionar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') onCerrar();
    }

    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [onCerrar]);

  return (
    <div
      className="fixed inset-0 bg-brand-900/70 flex items-center justify-center z-50 p-4"
      onClick={onCerrar}
      role="dialog"
      aria-modal="true"
      aria-label="Video tutorial"
    >
      {/* El click de adentro no debe cerrar: si no, pausar el video o
          mover la barra de progreso cerraría el modal. */}
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-3xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-brand-900/8">
          <h2 className="font-display text-base font-semibold text-brand-900">
            Cómo cargar sus datos y documentos
          </h2>
          <button
            onClick={onCerrar}
            className="text-brand-900/40 hover:text-brand-900 text-xl leading-none px-2"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="aspect-video bg-brand-900">
          <iframe
            src={urlEmbed}
            title="Video tutorial para proveedores"
            className="w-full h-full"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        <div className="px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-brand-900/50">
            ¿No se ve el video? Es posible que la red de su empresa bloquee YouTube.
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline shrink-0"
          >
            Abrir en YouTube
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
