// src/modules/miFicha/components/ModalFichaRegistrada.tsx
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
 * Reemplaza el banner que antes quedaba flotando adentro del modal de
 * Ficha (con el formulario todavía abierto detrás) -> ahora, apenas se
 * completa la 4ta sección, ModalFichaProveedor se cierra solo y este
 * modal aparece por separado, como una confirmación real de que la
 * ficha quedó registrada, en vez de un aviso conviviendo con un
 * formulario que ya no hay nada más que llenar.
 */
export default function ModalFichaRegistrada({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-brand-900/50 flex items-center justify-center z-50 p-4">
      <div className="animar-modal-exito bg-white rounded-xl shadow-xl w-full max-w-sm p-7 text-center">
        <div className="animar-rebote-check mx-auto h-16 w-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
          <IconoCheck />
        </div>

        <h2 className="font-display text-lg font-semibold text-brand-900">
          Su Ficha de Proveedor quedó registrada
        </h2>
        <p className="text-sm text-brand-900/60 mt-2">
          Completó las 4 secciones correctamente. El siguiente paso para continuar su proceso como proveedor es
          cargar su documentación.
        </p>

        <div className="flex flex-col gap-2 mt-6">
          <Link
            to="/documentos"
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-brand-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors cursor-pointer"
          >
            Ir a Documentación
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