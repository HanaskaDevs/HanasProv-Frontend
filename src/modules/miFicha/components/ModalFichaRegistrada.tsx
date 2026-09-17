// src/modules/miFicha/components/ModalFichaRegistrada.tsx
import { Link } from 'react-router-dom';
import Button from '../../../shared/components/Button';
import { formatearFechaLarga } from '../utils/fecha';

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

function IconoEscudo() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

/**
 * Confirmación que aparece apenas se completa la 4ta sección: la ficha
 * quedó guardada y ENVIADA a revisión del equipo (17-sep-2026: antes decía
 * solo "quedó registrada", y el proveedor no sabía si tenía que hacer algo
 * más para que la revisaran). Reemplaza el banner que antes quedaba
 * flotando adentro del modal de Ficha con el formulario ya sin nada más
 * que llenar: ModalFichaProveedor se cierra solo y este modal aparece por
 * separado.
 *
 * Si el backend devolvió la fecha de aceptación de las políticas, se le
 * muestra como constancia de lo que acaba de aceptar.
 */
export default function ModalFichaRegistrada({
  onClose,
  fechaAceptacionPoliticas,
}: {
  onClose: () => void;
  /** 'YYYY-MM-DD' que devuelve el backend, o null si no la hubo. */
  fechaAceptacionPoliticas?: string | null;
}) {
  return (
    <div className="fixed inset-0 bg-brand-900/50 flex items-center justify-center z-50 p-4">
      <div className="animar-modal-exito bg-white rounded-xl shadow-xl w-full max-w-sm p-7 text-center">
        <div className="animar-rebote-check mx-auto h-16 w-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
          <IconoCheck />
        </div>

        <h2 className="font-display text-lg font-semibold text-brand-900">
          Su ficha fue enviada a revisión
        </h2>
        <p className="text-sm text-brand-900/60 mt-2">
          Guardamos su Ficha de Proveedor y la enviamos al equipo de Hanaska para su revisión. Le
          notificaremos por correo el resultado.
        </p>

        {fechaAceptacionPoliticas && (
          <p className="mt-3 inline-flex items-start gap-1.5 text-left text-xs text-brand-900/60 rounded-md bg-brand-200/20 px-3 py-2">
            <span className="mt-0.5 shrink-0 text-brand-700">
              <IconoEscudo />
            </span>
            <span>
              Aceptación de las Políticas de Hanaska registrada el{' '}
              <span className="font-medium text-brand-900/80">{formatearFechaLarga(fechaAceptacionPoliticas)}</span>.
            </span>
          </p>
        )}

        <p className="text-sm text-brand-900/60 mt-3">
          El siguiente paso para continuar su proceso como proveedor es cargar su documentación.
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
