import { useState } from 'react';
import Button from '../../../shared/components/Button';

/**
 * Confirmación de un borrado DEFINITIVO.
 *
 * PIDE ESCRIBIR EL CORREO, y no es burocracia: esta acción no tiene
 * vuelta atrás y el botón vive en una fila de una tabla, al lado de
 * "Editar". Un clic de más en la fila equivocada borra la cuenta de otro
 * proveedor sin ninguna forma de recuperarla. Tener que copiar el correo
 * obliga a mirar CUÁL se está borrando, que es justo el error que se
 * quiere evitar.
 */
export default function ModalEliminarCuenta({
  correo,
  onConfirmar,
  onCerrar,
  eliminando = false,
  error,
}: {
  correo: string;
  onConfirmar: () => void;
  onCerrar: () => void;
  eliminando?: boolean;
  error?: string | null;
}) {
  const [escrito, setEscrito] = useState('');
  const coincide = escrito.trim().toLowerCase() === correo.toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="px-6 pb-5 pt-6">
          <h2 className="font-display text-base font-semibold text-brand-900">
            Eliminar esta cuenta definitivamente
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-brand-900/75">
            Se va a borrar la cuenta de <strong className="break-all">{correo}</strong> y su
            código de activación. <strong>No se puede deshacer.</strong>
          </p>
          <p className="mt-2 text-sm leading-relaxed text-brand-900/55">
            El correo queda libre para volver a darlo de alta, que es justamente para lo que
            sirve esto cuando se cargó mal.
          </p>

          <div className="mt-4 flex flex-col gap-1">
            <label htmlFor="confirmar-correo" className="text-sm font-medium text-brand-900">
              Escribí el correo para confirmar
            </label>
            <input
              id="confirmar-correo"
              value={escrito}
              onChange={(e) => setEscrito(e.target.value)}
              disabled={eliminando}
              autoComplete="off"
              className="rounded-md border border-brand-900/15 px-3 py-2 text-sm"
              placeholder={correo}
            />
          </div>

          {error && <p className="mt-3 text-sm text-brand-wine">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-brand-900/8 bg-brand-900/[0.02] px-6 py-3">
          <Button variant="ghost" onClick={onCerrar} disabled={eliminando}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={onConfirmar}
            isLoading={eliminando}
            disabled={!coincide || eliminando}
          >
            Eliminar definitivamente
          </Button>
        </div>
      </div>
    </div>
  );
}
