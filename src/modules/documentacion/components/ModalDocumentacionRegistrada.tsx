// src/modules/documentacion/components/ModalDocumentacionRegistrada.tsx
import { Link } from 'react-router-dom';
import Button from '../../../shared/components/Button';

function IconoCheck() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconoFlecha() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

/**
 * Mismo patrón que ModalFichaRegistrada (miFicha) -> confirmación
 * animada y separada, en vez de solo cerrar el modal de confirmación
 * y dejar que el badge de arriba cambie en silencio.
 */
export default function ModalDocumentacionRegistrada({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-brand-900/50 flex items-center justify-center z-50 p-4">
      <div className="animar-modal-exito bg-white rounded-xl shadow-xl w-full max-w-sm p-7 text-center">
        <div className="animar-rebote-check mx-auto h-16 w-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
          <IconoCheck />
        </div>

        <h2 className="font-display text-lg font-semibold text-brand-900">Su documentación quedó registrada</h2>
        <p className="text-sm text-brand-900/60 mt-2">
          Sus documentos ya no se pueden editar y quedaron en revisión del equipo. El siguiente paso para
          continuar su proceso como proveedor es registrar su Ficha de Productos.
        </p>

        <div className="flex flex-col gap-2 mt-6">
          <Link
            to="/productos"
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-brand-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors cursor-pointer"
          >
            Ir a Ficha Productos
            <IconoFlecha />
          </Link>
          <Button variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}