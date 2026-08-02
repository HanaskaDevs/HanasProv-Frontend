// src/modules/proveedores/components/ModalImportarCodigosBC.tsx
import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from '../../../shared/components/Modal';
import Button from '../../../shared/components/Button';
import { importarCodigosBC, type ResultadoImportacionCodigoBC } from '../api/productosProveedoresApi';

export default function ModalImportarCodigosBC({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [resultado, setResultado] = useState<ResultadoImportacionCodigoBC | null>(null);

  const importar = useMutation({
    mutationFn: (archivo: File) => importarCodigosBC(archivo),
    onSuccess: (data) => {
      setResultado(data);
      queryClient.invalidateQueries({ queryKey: ['productos-proveedores'] });
    },
  });

  function handleSeleccionar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (f) {
      setArchivo(f);
      setResultado(null);
    }
  }

  return (
    <Modal onClose={onClose} title="Importar Códigos BC">
      {!resultado ? (
        <div className="space-y-4">
          <p className="text-xs text-brand-900/60">
            El Excel debe tener 2 columnas, sin encabezado especial: <b>A</b> = Código de barras del producto,{' '}
            <b>B</b> = Código BC. La primera fila se descarta (se asume que es el encabezado).
          </p>

          <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleSeleccionar} />

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full rounded-md border-2 border-dashed border-brand-900/20 px-4 py-6 text-center text-sm text-brand-900/60 hover:border-brand-700/40 hover:text-brand-900 transition-colors"
          >
            {archivo ? (
              <span className="font-medium text-brand-900">{archivo.name}</span>
            ) : (
              'Clic para elegir el archivo Excel (.xlsx)'
            )}
          </button>

          {importar.isError && (
            <p className="text-sm text-brand-wine">No se pudo procesar el archivo. Verifique el formato e intente de nuevo.</p>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-brand-900/8">
            <Button variant="ghost" onClick={onClose} disabled={importar.isPending}>
              Cancelar
            </Button>
            <Button
              disabled={!archivo}
              isLoading={importar.isPending}
              onClick={() => archivo && importar.mutate(archivo)}
            >
              Importar
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-md bg-emerald-50 border border-emerald-200 px-4 py-3">
            <p className="text-sm text-emerald-800 font-medium">
              {resultado.actualizados} producto{resultado.actualizados === 1 ? '' : 's'} actualizado
              {resultado.actualizados === 1 ? '' : 's'} correctamente.
            </p>
          </div>

          {resultado.no_encontrados.length > 0 && (
            <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-3">
              <p className="text-sm text-amber-800 font-medium">
                {resultado.no_encontrados.length} código{resultado.no_encontrados.length === 1 ? '' : 's'} de barras
                no se encontró{resultado.no_encontrados.length === 1 ? '' : 'ron'} entre los productos de esta
                empresa:
              </p>
              <p className="text-xs text-amber-800/80 mt-1 break-words">{resultado.no_encontrados.join(', ')}</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-brand-900/8">
            <Button variant="ghost" onClick={() => setResultado(null)}>
              Importar otro archivo
            </Button>
            <Button onClick={onClose}>Cerrar</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}