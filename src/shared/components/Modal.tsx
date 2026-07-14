import { type ReactNode } from 'react';

interface ModalProps {
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: string;
}

/**
 * Modal genérico y reutilizable (fondo oscuro + tarjeta centrada). Antes
 * cada pantalla armaba su propio overlay a mano (ver ModalFichaProveedor);
 * este queda para confirmaciones y diálogos simples en cualquier módulo.
 * z-[60] -> por encima de cualquier otro modal de página (z-50), por si
 * alguna vez se necesita confirmar algo desde dentro de otro modal.
 */
export default function Modal({ onClose, title, children, maxWidth = 'max-w-md' }: ModalProps) {
  return (
    <div
      className="fixed inset-0 bg-brand-900/50 flex items-center justify-center p-4 z-[60]"
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidth} rounded-lg bg-white shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-3 border-b border-brand-900/8">
            <h2 className="font-display text-base font-semibold text-brand-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-brand-900/40 hover:text-brand-900 text-xl leading-none px-1"
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}