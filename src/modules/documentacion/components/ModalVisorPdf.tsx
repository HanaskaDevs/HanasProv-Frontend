// src/modules/documentacion/components/ModalVisorPdf.tsx
import { useEffect, useState } from 'react';
import * as documentacionApi from '../api/documentacionApi';
import Spinner from '../../../shared/components/Spinner';

/**
 * Visor de PDF a pantalla casi completa. El <iframe> no puede mandar el
 * header Authorization por su cuenta -> por eso el PDF se trae primero
 * como blob (con axios, que sí manda el token) y se le pasa al iframe
 * como blob: URL. Se revoca al cerrar para no acumular memoria si el
 * proveedor abre varios documentos seguidos. Mismo componente que ya
 * usa el admin en su vista de calificación, adaptado a la API del
 * proveedor (mi-documentos en vez de proveedores/documentos-calificacion).
 */
export default function ModalVisorPdf({
  idDocumentoProveedor,
  nombre,
  onClose,
}: {
  idDocumentoProveedor: number;
  nombre: string;
  onClose: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    let urlCreada: string | null = null;

    documentacionApi
      .obtenerUrlVisorDocumento(idDocumentoProveedor)
      .then((blobUrl) => {
        if (cancelado) {
          window.URL.revokeObjectURL(blobUrl);
          return;
        }
        urlCreada = blobUrl;
        setUrl(blobUrl);
      })
      .catch(() => !cancelado && setError('No se pudo cargar el documento.'));

    return () => {
      cancelado = true;
      if (urlCreada) window.URL.revokeObjectURL(urlCreada);
    };
  }, [idDocumentoProveedor]);

  return (
    <div className="fixed inset-0 bg-brand-900/70 flex items-center justify-center p-4 z-[70]" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl w-full h-full max-w-5xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-brand-900/8">
          <h2 className="font-display text-sm font-semibold text-brand-900 truncate pr-4">{nombre}</h2>
          <button
            onClick={onClose}
            className="text-brand-900/40 hover:text-brand-900 text-xl leading-none px-2 shrink-0"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="flex-1 min-h-0 bg-brand-900/5">
          {error ? (
            <div className="h-full flex items-center justify-center text-sm text-brand-wine">{error}</div>
          ) : !url ? (
            <div className="h-full flex items-center justify-center">
              <Spinner className="h-6 w-6" />
            </div>
          ) : (
            <iframe src={url} title={nombre} className="w-full h-full border-0" />
          )}
        </div>
      </div>
    </div>
  );
}