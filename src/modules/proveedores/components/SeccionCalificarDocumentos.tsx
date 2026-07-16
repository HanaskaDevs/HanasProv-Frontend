import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as proveedoresApi from '../api/proveedoresApi';
import type { ChecklistCalificacion, DocumentoCalificable, TipoDocumentoCalificable } from '../types';
import ControlesCalificacion from './ControlesCalificacion';
import ModalVisorPdf from './ModalVisorPdf';
import Card from '../../../shared/components/Card';
import Spinner from '../../../shared/components/Spinner';

function IconoOjo({ className = '' }: { className?: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function FilaDocumento({
  tipo,
  doc,
  idProveedor,
  onVer,
}: {
  tipo: TipoDocumentoCalificable;
  doc: DocumentoCalificable;
  idProveedor: number;
  onVer: (doc: DocumentoCalificable) => void;
}) {
  const queryClient = useQueryClient();

  const calificar = useMutation({
    mutationFn: (payload: { aprobado: boolean; observacion?: string }) =>
      proveedoresApi.calificarDocumento(doc.id_documento_proveedor, payload),
    onSuccess: (resultado) => {
      // Igual que en la Ficha: el POST ya devuelve el estado actualizado
      // de ESE documento -> lo insertamos directo en el caché (buscando
      // ese id dentro de la lista anidada) en vez de re-pedir todo el
      // checklist completo de nuevo.
      queryClient.setQueryData<ChecklistCalificacion | undefined>(
        ['calificacion-documentos', idProveedor],
        (actual) => {
          if (!actual) return actual;
          return {
            ...actual,
            documentos: actual.documentos.map((t) => ({
              ...t,
              documentos: t.documentos.map((d) =>
                d.id_documento_proveedor === resultado.id_documento_proveedor ? { ...d, ...resultado } : d
              ),
            })),
          };
        }
      );
      queryClient.invalidateQueries({ queryKey: ['proveedores-lista'] });
    },
  });

  return (
    <div className="py-2.5 flex items-start justify-between gap-4 flex-wrap">
      <div className="min-w-0">
        <p className="text-xs font-medium text-brand-900 truncate" title={doc.nombre_original}>
          {doc.nombre_original}
          {tipo.obligatorio && <span className="text-brand-wine"> *</span>}
        </p>
        {doc.fecha_caducidad && (
          <p className="text-[10.5px] font-bold text-brand-900/60">Fecha_Exp_{doc.fecha_caducidad}</p>
        )}
        <button
          onClick={() => onVer(doc)}
          className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-brand-700 hover:text-brand-900"
        >
          <IconoOjo /> Ver documento
        </button>
      </div>

      <ControlesCalificacion
        estado={doc.estado_calificacion}
        observacion={doc.comentario_calificacion}
        fecha={doc.fecha_calificacion}
        calificando={calificar.isPending}
        onCalificar={(aprobado, observacion) => calificar.mutate({ aprobado, observacion })}
      />
    </div>
  );
}

export default function SeccionCalificarDocumentos({ idProveedor }: { idProveedor: number }) {
  const [documentoEnVisor, setDocumentoEnVisor] = useState<DocumentoCalificable | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['calificacion-documentos', idProveedor],
    queryFn: () => proveedoresApi.obtenerDocumentosCalificacion(idProveedor),
  });

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  const tiposConDocumentos = data.documentos.filter((t) => t.documentos.length > 0);
  const categorias = Array.from(new Set(tiposConDocumentos.map((t) => t.categoria)));

  return (
    <div className="space-y-4">
      {!data.documentacion_registrada && (
        <Card className="bg-brand-yellow/10 border-brand-yellow/30">
          <p className="text-sm text-brand-900">
            Este proveedor todavía no registra su documentación. Puedes revisar lo que ya cargó, pero probablemente
            le falten documentos obligatorios.
          </p>
        </Card>
      )}

      {tiposConDocumentos.length === 0 ? (
        <Card>
          <p className="text-sm text-brand-900/50 text-center py-8">Este proveedor todavía no cargó documentos.</p>
        </Card>
      ) : (
        categorias.map((categoria) => (
          <Card key={categoria}>
            <h3 className="font-display text-xs font-bold text-brand-900 uppercase tracking-wide mb-1">
              {categoria}
            </h3>
            <div className="divide-y divide-brand-900/8">
              {tiposConDocumentos
                .filter((t) => t.categoria === categoria)
                .flatMap((tipo) =>
                  tipo.documentos.map((doc) => (
                    <FilaDocumento
                      key={doc.id_documento_proveedor}
                      tipo={tipo}
                      doc={doc}
                      idProveedor={idProveedor}
                      onVer={setDocumentoEnVisor}
                    />
                  ))
                )}
            </div>
          </Card>
        ))
      )}

      {documentoEnVisor && (
        <ModalVisorPdf
          idDocumentoProveedor={documentoEnVisor.id_documento_proveedor}
          nombre={documentoEnVisor.nombre_original}
          onClose={() => setDocumentoEnVisor(null)}
        />
      )}
    </div>
  );
}