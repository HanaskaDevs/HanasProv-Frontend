import { useRef, useState, type ChangeEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import * as documentacionApi from '../api/documentacionApi';
import type { TipoDocumentoChecklist } from '../types';
import Card from '../../../shared/components/Card';
import Spinner from '../../../shared/components/Spinner';

const TAMANO_MAXIMO_MB = 4;

function CasillaDocumento({ tipo }: { tipo: TipoDocumentoChecklist }) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fechaCaducidad, setFechaCaducidad] = useState('');
  const [error, setError] = useState<string | null>(null);

  const subir = useMutation({
    mutationFn: (archivo: File) =>
      documentacionApi.subirDocumento(tipo.id_tipo_documento, archivo, fechaCaducidad || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mi-documentos'] });
      setFechaCaducidad('');
      setError(null);
    },
    onError: () => setError('No se pudo subir. Verifica que sea PDF y pese menos de 4MB.'),
  });

  const ver = useMutation({
    mutationFn: (doc: TipoDocumentoChecklist['documentos'][number]) =>
      documentacionApi.descargarDocumento(doc.id_documento_proveedor),
  });

  function handleSeleccionar(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;

    if (archivo.type !== 'application/pdf') {
      setError('Solo se aceptan archivos PDF.');
      return;
    }
    if (archivo.size > TAMANO_MAXIMO_MB * 1024 * 1024) {
      setError(`El archivo supera los ${TAMANO_MAXIMO_MB}MB.`);
      return;
    }
    if (tipo.requiere_fecha_caducidad && !fechaCaducidad) {
      setError('Indica la fecha de caducidad antes de subir el archivo.');
      return;
    }

    setError(null);
    subir.mutate(archivo);
  }

  const yaSubido = tipo.documentos.length > 0;
  // Sin "permite_multiples": solo mostramos el cuadro de carga si todavía
  // no hay nada (después se reemplaza con el link "Reemplazar").
  // Con "permite_multiples": el cuadro se queda siempre visible para
  // seguir agregando, además de la lista de lo ya subido.
  const mostrarCuadroCarga = tipo.permite_multiples || !yaSubido;

  return (
    <div className="min-w-0">
      <div className="h-8 mb-1">
        <p className="text-xs font-medium text-brand-900 line-clamp-2">
          {tipo.nombre_documento}
          {tipo.obligatorio && <span className="text-brand-wine"> *</span>}
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleSeleccionar}
      />

      {tipo.requiere_fecha_caducidad && (
        <input
          type="date"
          value={fechaCaducidad}
          onChange={(e) => setFechaCaducidad(e.target.value)}
          className="mb-1.5 w-full rounded-md border border-brand-900/15 px-2 py-1 text-xs text-brand-900
            focus:outline-none focus:ring-2 focus:ring-brand-700"
        />
      )}

      {tipo.documentos.map((doc) => (
        <div
          key={doc.id_documento_proveedor}
          className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 mb-1.5"
        >
          <p className="text-xs font-medium text-emerald-800 flex items-center gap-1">✓ Cargado</p>
          <p className="text-[11px] text-emerald-700/70 truncate" title={doc.nombre_original}>
            {doc.nombre_original}
            {doc.fecha_caducidad && ` · vence ${doc.fecha_caducidad}`}
          </p>
          <div className="flex gap-3 mt-1">
            <button
              onClick={() => ver.mutate(doc)}
              className="text-[11px] font-medium text-brand-700 hover:underline"
            >
              Ver
            </button>
            {!tipo.permite_multiples && (
              <button
                onClick={() => inputRef.current?.click()}
                disabled={subir.isPending}
                className="text-[11px] font-medium text-brand-900/50 hover:underline"
              >
                Reemplazar
              </button>
            )}
          </div>
        </div>
      ))}

      {mostrarCuadroCarga && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={subir.isPending}
          className={`w-full rounded-md border-2 border-dashed px-3 py-2 text-left transition-colors
            ${
              tipo.obligatorio && !yaSubido
                ? 'border-brand-wine/30 hover:border-brand-wine/60 hover:bg-brand-wine/5'
                : 'border-brand-900/15 hover:border-brand-900/30 hover:bg-brand-900/5'
            }`}
        >
          <p className="text-xs font-medium text-brand-900">
            {subir.isPending ? <Spinner className="h-3 w-3 inline mr-1" /> : null}
            {yaSubido ? 'Cargar otro archivo' : 'Cargue aquí el documento'}
          </p>
          <p className="text-[11px] text-brand-900/40">PDF, máx. 4MB</p>
        </button>
      )}

      {error && <span className="text-[10px] text-brand-wine block mt-1">{error}</span>}
    </div>
  );
}

export default function ChecklistDocumentos() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['mi-documentos'],
    queryFn: documentacionApi.obtenerChecklist,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <p className="text-sm text-brand-wine">
          No se pudo cargar la documentación.{' '}
          {axios.isAxiosError(error) && error.response?.data?.message
            ? error.response.data.message
            : 'Intenta de nuevo más tarde.'}
        </p>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <p className="text-sm text-brand-900/60 text-center py-6">
          No hay documentos configurados todavía.
        </p>
      </Card>
    );
  }

  // 'General' antes que 'Certificaciones' (el backend ordena alfabético,
  // donde C < G, así que reordenamos acá para que salga en el orden
  // esperado por el equipo).
  const categorias = Array.from(new Set(data?.map((t) => t.categoria))).sort((a, b) =>
    a === 'General' ? -1 : b === 'General' ? 1 : a.localeCompare(b)
  );

  return (
    <div className="space-y-4">
      {categorias.map((categoria) => (
        <Card key={categoria}>
          <h3 className="font-display text-sm font-semibold text-brand-900 mb-3">{categoria}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data
              ?.filter((t) => t.categoria === categoria)
              .map((tipo) => <CasillaDocumento key={tipo.id_tipo_documento} tipo={tipo} />)}
          </div>
        </Card>
      ))}
    </div>
  );
}