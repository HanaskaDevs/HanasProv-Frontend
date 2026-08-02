import { type ReactNode, useState } from 'react';

interface ModalProps {
  onClose: () => void;
  title?: string;
  tituloExtra?: ReactNode;
  children: ReactNode;
  maxWidth?: string;
  /** Muestra el botón de expandir/contraer a pantalla completa, mismo
   *  patrón que ya usaba ModalFichaProveedor a mano -> ahora vive acá
   *  para que cualquier modal lo pueda usar sin repetir el código. */
  expandible?: boolean;
}

function IconoExpandir() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}

function IconoContraer() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 14 10 14 10 20" />
      <polyline points="20 10 14 10 14 4" />
      <line x1="14" y1="10" x2="21" y2="3" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}

/**
 * Modal genérico y reutilizable (fondo oscuro + tarjeta centrada). Antes
 * cada pantalla armaba su propio overlay a mano (ver ModalFichaProveedor);
 * este queda para confirmaciones y diálogos simples en cualquier módulo.
 * z-[60] -> por encima de cualquier otro modal de página (z-50), por si
 * alguna vez se necesita confirmar algo desde dentro de otro modal.
 */
export default function Modal({ onClose, title, tituloExtra, children, maxWidth = 'max-w-md', expandible = false }: ModalProps) {
  const [expandido, setExpandido] = useState(false);

  return (
    <div
      className={`fixed inset-0 bg-brand-900/50 flex items-center justify-center z-[60] transition-all ${
        expandido ? 'p-2' : 'p-4'
      }`}
      onClick={onClose}
    >
      <div
        className={`rounded-lg bg-white shadow-xl flex flex-col transition-all ${
          expandido ? 'w-full h-full max-w-none' : `w-full ${maxWidth} max-h-[85vh]`
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-3 border-b border-brand-900/8 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="font-display text-base font-semibold text-brand-900 truncate">{title}</h2>
              {tituloExtra}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {expandible && (
                <button
                  onClick={() => setExpandido((v) => !v)}
                  className="text-brand-900/40 hover:text-brand-900 p-1"
                  aria-label={expandido ? 'Contraer' : 'Expandir'}
                  title={expandido ? 'Contraer' : 'Expandir'}
                >
                  {expandido ? <IconoContraer /> : <IconoExpandir />}
                </button>
              )}
              <button
                onClick={onClose}
                className="text-brand-900/40 hover:text-brand-900 text-xl leading-none px-1"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
          </div>
        )}
        <div className="p-5 overflow-y-auto flex-1 min-h-0">{children}</div>
      </div>
    </div>
  );
}