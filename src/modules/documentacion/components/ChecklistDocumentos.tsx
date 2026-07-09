import { useRef, useState, type ChangeEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as documentacionApi from '../api/documentacionApi';
import type { TipoDocumentoChecklist } from '../types';
import Card from '../../../shared/components/Card';
import Badge from '../../../shared/components/Badge';
import Button from '../../../shared/components/Button';
import Spinner from '../../../shared/components/Spinner';

function FilaDocumento({ tipo }: { tipo: TipoDocumentoChecklist }) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fechaCaducidad, setFechaCaducidad] = useState('');

  const subir = useMutation({
    mutationFn: (archivo: File) =>
      documentacionApi.subirDocumento(tipo.id_tipo_documento, archivo, fechaCaducidad || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mi-documentos'] });
      setFechaCaducidad('');
    },
  });

  const documentoVigente = tipo.documentos[0] ?? null;

  function handleSeleccionarArchivo(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    if (tipo.requiere_fecha_caducidad && !fechaCaducidad) {
      alert('Este documento requiere fecha de caducidad.');
      return;
    }

    subir.mutate(archivo);
    e.target.value = '';
  }

  async function handleDescargar() {
    if (!documentoVigente) return;
    await documentacionApi.descargarDocumento(documentoVigente.id_documento_proveedor, documentoVigente.nombre_original);
  }

  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-brand-900/8 last:border-0">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-brand-900">{tipo.nombre_documento}</p>
          {tipo.obligatorio ? <Badge tone="danger">Obligatorio</Badge> : <Badge tone="neutral">Opcional</Badge>}
          {documentoVigente && <Badge tone="success">{documentoVigente.estado}</Badge>}
        </div>
        {documentoVigente ? (
          <p className="text-xs text-brand-900/50 mt-0.5 truncate">
            {documentoVigente.nombre_original}
            {documentoVigente.fecha_caducidad && ` · vence ${documentoVigente.fecha_caducidad}`}
          </p>
        ) : (
          <p className="text-xs text-brand-900/40 mt-0.5">Sin documento cargado</p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {tipo.requiere_fecha_caducidad && (
          <input
            type="date"
            value={fechaCaducidad}
            onChange={(e) => setFechaCaducidad(e.target.value)}
            className="rounded-md border border-brand-900/15 px-2 py-1.5 text-xs"
          />
        )}

        {documentoVigente && (
          <Button variant="ghost" onClick={handleDescargar} className="text-xs px-2 py-1.5">
            Ver
          </Button>
        )}

        <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleSeleccionarArchivo} />
        <Button variant="secondary" isLoading={subir.isPending} onClick={() => inputRef.current?.click()} className="text-xs px-3 py-1.5">
          {documentoVigente ? 'Reemplazar' : 'Subir'}
        </Button>
      </div>
    </div>
  );
}

export default function ChecklistDocumentos() {
  const { data, isLoading } = useQuery({
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

  const categorias = Array.from(new Set(data?.map((t) => t.categoria)));

  return (
    <div className="space-y-6">
      {categorias.map((categoria) => (
        <Card key={categoria}>
          <h3 className="font-display text-sm font-semibold text-brand-900 mb-3">{categoria}</h3>
          <div>
            {data?.filter((t) => t.categoria === categoria).map((tipo) => (
              <FilaDocumento key={tipo.id_tipo_documento} tipo={tipo} />
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}