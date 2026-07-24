// src/modules/proveedores/components/SeccionCalificarDocumentos.tsx
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import * as proveedoresApi from '../api/proveedoresApi';
import type { ChecklistCalificacion, DocumentoCalificable, TipoDocumentoCalificable } from '../types';
import ControlesCalificacion from './ControlesCalificacion';
import ModalVisorPdf from './ModalVisorPdf';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import Badge from '../../../shared/components/Badge';
import Spinner from '../../../shared/components/Spinner';
import Modal from '../../../shared/components/Modal';

function IconoDocumento({ className = '' }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function IconoOjo({ className = '' }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function formateaFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Detalle organizado de los documentos rechazados -> lo que se ve al pulsar "Más información". */
function ModalDetalleRechazo({
  documentos,
  onClose,
}: {
  documentos: { tipo: TipoDocumentoCalificable; doc: DocumentoCalificable }[];
  onClose: () => void;
}) {
  return (
    <Modal onClose={onClose} title={`Documentos rechazados (${documentos.length})`} maxWidth="max-w-lg">
      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
        {documentos.map(({ tipo, doc }) => (
          <div key={doc.id_documento_proveedor} className="rounded-lg border border-brand-wine/15 bg-brand-wine/[0.03] p-3">
            <p className="text-[10.5px] text-brand-900/50">{tipo.nombre_documento}</p>
            <p className="text-xs font-semibold text-brand-900">{doc.nombre_original}</p>
            <p className="text-sm text-brand-900/75 mt-1">{doc.comentario_calificacion}</p>
          </div>
        ))}
      </div>
    </Modal>
  );
}

function FilaDocumento({
  tipo,
  doc,
  idProveedor,
  soloLectura,
  onVer,
}: {
  tipo: TipoDocumentoCalificable;
  doc: DocumentoCalificable;
  idProveedor: number;
  soloLectura: boolean;
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

  const chip =
    doc.estado_calificacion === 'Aprobado'
      ? 'bg-emerald-100 text-emerald-600'
      : doc.estado_calificacion === 'Rechazado'
        ? 'bg-brand-wine/10 text-brand-wine'
        : 'bg-brand-900/6 text-brand-900/40';

  return (
    <div className="rounded-xl border border-brand-900/20 bg-white shadow-sm p-3 space-y-2">
      <div className="flex items-start gap-2.5">
        <span className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${chip}`}>
          <IconoDocumento />
        </span>
        <div className="min-w-0">
          <p className="text-[10.5px] text-brand-900/50 truncate">
            {tipo.nombre_documento}
            {tipo.obligatorio && <span className="text-brand-wine"> *</span>}
          </p>
          <p className="text-xs font-medium text-brand-900 truncate" title={doc.nombre_original}>
            {doc.nombre_original}
          </p>
          <div className="flex items-center gap-1.5 flex-wrap mt-1">
            {doc.fecha_caducidad && <Badge tone="info">Vence {doc.fecha_caducidad}</Badge>}
          </div>
          {doc.fecha_subida && (
            <p className="text-[10.5px] text-brand-900/40 mt-1">
              Subido el: <span className="text-brand-900/60">{formateaFecha(doc.fecha_subida)}</span>
            </p>
          )}
        </div>
      </div>

      <button
        onClick={() => onVer(doc)}
        className="inline-flex items-center gap-1 rounded-md bg-brand-700/8 px-2 py-1 text-[11px]
          font-medium text-brand-700 hover:bg-brand-700/15 transition-colors"
      >
        <IconoOjo /> Ver documento
      </button>

      <div className="pt-1 border-t border-brand-900/6">
        <ControlesCalificacion
          estado={doc.estado_calificacion}
          observacion={doc.comentario_calificacion}
          fecha={doc.fecha_calificacion}
          calificando={calificar.isPending}
          soloLectura={soloLectura}
          onCalificar={(aprobado, observacion) => calificar.mutate({ aprobado, observacion })}
        />
      </div>
    </div>
  );
}

export default function SeccionCalificarDocumentos({ idProveedor }: { idProveedor: number }) {
  const queryClient = useQueryClient();
  const [documentoEnVisor, setDocumentoEnVisor] = useState<DocumentoCalificable | null>(null);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['calificacion-documentos', idProveedor],
    queryFn: () => proveedoresApi.obtenerDocumentosCalificacion(idProveedor),
  });

  const registrar = useMutation({
    mutationFn: () => proveedoresApi.registrarCalificacionDocumentos(idProveedor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calificacion-documentos', idProveedor] });
      queryClient.invalidateQueries({ queryKey: ['proveedores-lista'] });
    },
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
  const todosLosDocumentos = tiposConDocumentos.flatMap((t) =>
    t.documentos.map((doc) => ({ tipo: t, doc }))
  );
  const totalCalificados = todosLosDocumentos.filter(({ doc }) => doc.estado_calificacion !== null).length;
  const faltanPorCalificar = todosLosDocumentos.length - totalCalificados;
  const documentosRechazados = todosLosDocumentos.filter(({ doc }) => doc.estado_calificacion === 'Rechazado');

  const registrada = data.calificacion_documentos_registrada;
  const hayRechazados = documentosRechazados.length > 0;

  return (
    <div className="space-y-4">
      {!data.documentacion_registrada && (
        <Card className="!p-3 bg-brand-yellow/10 border-brand-yellow/30">
          <p className="text-xs text-brand-900">
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
        <>
          <Card className="!p-3">
            {registrada ? (
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <Badge tone="info">Documentación Calificada</Badge>
                  <p className="text-xs text-brand-900/55">
                    {hayRechazados
                      ? 'Pendiente de correcciones por parte del aspirante.'
                      : 'Aprobada. No hay nada más que hacer aquí.'}
                  </p>
                </div>
                {hayRechazados && (
                  <Button
                    variant="ghost"
                    className="!bg-brand-200/40 hover:!bg-brand-200/60 text-xs px-3 py-1.5 shrink-0"
                    onClick={() => setModalDetalleAbierto(true)}
                  >
                    Más información
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-xs text-brand-900/60">
                  {faltanPorCalificar > 0
                    ? `Te falta calificar ${faltanPorCalificar} de ${todosLosDocumentos.length} documento(s).`
                    : `Ya calificaste los ${todosLosDocumentos.length} documento(s) cargados.`}
                </p>
                <Button
                  variant="primary"
                  className="shrink-0"
                  disabled={faltanPorCalificar > 0}
                  isLoading={registrar.isPending}
                  onClick={() => registrar.mutate()}
                >
                  Registrar calificación
                </Button>
              </div>
            )}
            {registrar.isError && (
              <p className="text-xs text-brand-wine mt-2">
                {axios.isAxiosError(registrar.error) && registrar.error.response?.data?.errors
                  ? Object.values(registrar.error.response.data.errors).flat().join(' ')
                  : 'No se pudo registrar. Intenta de nuevo.'}
              </p>
            )}
          </Card>

          {categorias.map((categoria) => {
            const tiposCategoria = tiposConDocumentos.filter((t) => t.categoria === categoria);
            const documentosCategoria = tiposCategoria.flatMap((t) => t.documentos);
            const calificadosCategoria = documentosCategoria.filter((d) => d.estado_calificacion !== null).length;

            return (
              <section key={categoria}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <h3 className="font-display text-xs font-bold text-brand-900 uppercase tracking-wide">
                    {categoria}
                  </h3>
                  <span className="text-[11px] text-brand-900/40">
                    {calificadosCategoria}/{documentosCategoria.length} calificados
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {tiposCategoria.flatMap((tipo) =>
                    tipo.documentos.map((doc) => (
                      <FilaDocumento
                        key={doc.id_documento_proveedor}
                        tipo={tipo}
                        doc={doc}
                        idProveedor={idProveedor}
                        soloLectura={registrada}
                        onVer={setDocumentoEnVisor}
                      />
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </>
      )}

      {documentoEnVisor && (
        <ModalVisorPdf
          idDocumento={documentoEnVisor.id_documento_proveedor}
          nombre={documentoEnVisor.nombre_original}
          obtenerUrl={proveedoresApi.obtenerUrlVisorDocumento}
          onClose={() => setDocumentoEnVisor(null)}
        />
      )}

      {modalDetalleAbierto && (
        <ModalDetalleRechazo documentos={documentosRechazados} onClose={() => setModalDetalleAbierto(false)} />
      )}
    </div>
  );
}