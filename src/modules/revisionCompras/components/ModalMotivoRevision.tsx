import { useState } from 'react';
import Modal from '../../../shared/components/Modal';
import Button from '../../../shared/components/Button';

/** Lo mínimo que se acepta como motivo. Igual que en el backend. */
const MINIMO_CARACTERES = 10;

/**
 * Pide el motivo antes de devolver o retirar un producto.
 *
 * ES OBLIGATORIO Y TIENE MÍNIMO porque este texto es lo ÚNICO que el
 * proveedor va a recibir para saber qué corregir: le llega tal cual por
 * correo. Un "no" suelto lo deja adivinando, que es exactamente el
 * problema que este circuito vino a resolver.
 */
export default function ModalMotivoRevision({
  accion,
  nombreProducto,
  enviando,
  onConfirmar,
  onClose,
}: {
  accion: 'rechazar' | 'eliminar';
  nombreProducto: string;
  enviando: boolean;
  onConfirmar: (observacion: string) => void;
  onClose: () => void;
}) {
  const [observacion, setObservacion] = useState('');
  const [tocado, setTocado] = useState(false);

  const esEliminar = accion === 'eliminar';
  const faltan = MINIMO_CARACTERES - observacion.trim().length;
  const valido = faltan <= 0;

  return (
    <Modal onClose={onClose} title={esEliminar ? 'Retirar del catálogo' : 'Devolver para corregir'}>
      <div className="space-y-3">
        <p className="text-sm text-brand-900/70">
          {esEliminar ? (
            <>
              <strong className="text-brand-900">{nombreProducto}</strong> se va a retirar del catálogo. El
              proveedor tendrá que cargarlo de nuevo si corresponde.
            </>
          ) : (
            <>
              <strong className="text-brand-900">{nombreProducto}</strong> vuelve al proveedor con tus
              observaciones. Conserva los documentos que ya subió: solo corrige y lo reenvía.
            </>
          )}
        </p>

        <div className="flex flex-col gap-1">
          <label htmlFor="observacion-revision" className="text-sm font-medium text-brand-900">
            Motivo <span className="font-normal text-brand-900/45">— lo va a leer el proveedor</span>
          </label>
          <textarea
            id="observacion-revision"
            rows={4}
            autoFocus
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            onBlur={() => setTocado(true)}
            maxLength={500}
            placeholder={
              esEliminar
                ? 'Ej.: Este producto no corresponde al rubro que tiene aprobado.'
                : 'Ej.: La ficha técnica no corresponde al producto declarado. Vuelve a cargarla.'
            }
            className="rounded-md border border-brand-900/15 px-3 py-2 text-sm text-brand-900 placeholder:text-brand-900/35
              focus:outline-none focus:ring-2 focus:ring-brand-700"
          />
          <div className="flex items-baseline justify-between gap-2">
            {tocado && !valido ? (
              <span className="text-xs text-brand-wine">
                Explica qué tiene que corregir: faltan {faltan} caracteres.
              </span>
            ) : (
              <span className="text-[11.5px] text-brand-900/40">Se envía por correo al proveedor.</span>
            )}
            <span className="text-[11.5px] text-brand-900/35 tabular-nums">{observacion.length}/500</span>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} disabled={enviando}>
            Cancelar
          </Button>
          <Button
            variant={esEliminar ? 'danger' : 'primary'}
            isLoading={enviando}
            onClick={() => {
              setTocado(true);
              if (valido) onConfirmar(observacion.trim());
            }}
          >
            {esEliminar ? 'Retirar y avisar' : 'Devolver y avisar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
