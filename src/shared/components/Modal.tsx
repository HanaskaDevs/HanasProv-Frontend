import { type ReactNode, useEffect, useState } from 'react';
import { useBackHandler } from '../hooks/useBackHandler';

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

  // Transición de entrada: el modal se monta ya visible en el DOM y en el
  // siguiente frame se le enciende la clase de "montado". Sin ese salto de un
  // frame el navegador no ve un cambio de estado y no hay transición, aparece
  // de golpe.
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMontado(true));

    return () => cancelAnimationFrame(frame);
  }, []);

  // Cualquier modal (confirmaciones, detalles, formularios) se cierra con
  // el botón físico "atrás" de Android en vez de mandar a otra página ->
  // ver src/shared/utils/pilaAtras.ts para el porqué.
  useBackHandler(onClose);

  // Escape cierra. Es lo que espera cualquiera que abra un diálogo, y en
  // pantallas donde el modal tapa todo era la única salida que faltaba.
  useEffect(() => {
    function alPresionar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', alPresionar);

    return () => window.removeEventListener('keydown', alPresionar);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={`fixed inset-0 flex items-center justify-center z-[60] transition-[background-color,padding] duration-200 ${
        montado ? 'bg-brand-900/50' : 'bg-brand-900/0'
      } ${expandido ? 'p-2' : 'p-4'}`}
      onClick={onClose}
    >
      <div
        className={`rounded-xl bg-white shadow-2xl flex flex-col
          transition-[opacity,transform,width,height,max-width,max-height] duration-200 ease-out
          motion-reduce:transition-none
          ${montado ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
          ${expandido ? 'w-full h-full max-w-none' : `w-full ${maxWidth} max-h-[85vh]`}`}
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