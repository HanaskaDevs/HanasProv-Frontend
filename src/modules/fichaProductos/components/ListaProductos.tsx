import { useRef, useState, type ChangeEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as productosApi from '../api/productosApi';
import type { Producto } from '../types';
import Card from '../../../shared/components/Card';
import Badge from '../../../shared/components/Badge';
import Button from '../../../shared/components/Button';
import Spinner from '../../../shared/components/Spinner';
import ModalCrearProducto from './ModalCrearProducto';

const TIPOS_DOCUMENTO_PRODUCTO = [
  { id: 1, slug: 'ficha-tecnica', etiqueta: 'Ficha técnica', obligatorio: true },
  { id: 2, slug: 'analisis-producto', etiqueta: 'Análisis de producto', obligatorio: true },
  { id: 3, slug: 'carta-alergenos', etiqueta: 'Carta de alérgenos', obligatorio: false },
];

function BotonDocumentoProducto({ producto, tipo }: {
  producto: Producto;
  tipo: (typeof TIPOS_DOCUMENTO_PRODUCTO)[number];
}) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const yaSubido = producto.documentos.find((d) => d.tipo === tipo.slug);

  const subir = useMutation({
    mutationFn: (archivo: File) => productosApi.subirDocumentoProducto(producto.id_producto, tipo.id, archivo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mis-productos'] }),
  });

  function handleSeleccionar(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (archivo) subir.mutate(archivo);
    e.target.value = '';
  }

  return (
    <div className="flex items-center gap-1.5">
      <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleSeleccionar} />
      <Button
        variant={yaSubido ? 'secondary' : tipo.obligatorio ? 'primary' : 'ghost'}
        isLoading={subir.isPending}
        onClick={() => inputRef.current?.click()}
        className="text-xs px-2.5 py-1"
      >
        {tipo.etiqueta}
        {yaSubido ? ' ✓' : tipo.obligatorio ? ' *' : ''}
      </Button>
    </div>
  );
}

export default function ListaProductos() {
  const [modalAbierto, setModalAbierto] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['mis-productos'],
    queryFn: productosApi.listarProductos,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setModalAbierto(true)}>+ Agregar producto</Button>
      </div>

      {data?.length === 0 && (
        <Card>
          <p className="text-sm text-brand-900/60 text-center py-6">
            Todavía no has agregado ningún producto.
          </p>
        </Card>
      )}

      {data?.map((producto) => (
        <Card key={producto.id_producto}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="font-medium text-brand-900">{producto.nombre_producto}</p>
              <p className="text-xs text-brand-900/50 mt-0.5">
                {producto.codigo_barras ?? 'Sin código de barras'} · {producto.unidad_presentacion} · ${producto.precio}
              </p>
            </div>
            <Badge tone={producto.documentos.length >= 2 ? 'success' : 'warning'}>
              {producto.documentos.length} / 3 documentos
            </Badge>
          </div>

          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-brand-900/8">
            {TIPOS_DOCUMENTO_PRODUCTO.map((tipo) => (
              <BotonDocumentoProducto key={tipo.id} producto={producto} tipo={tipo} />
            ))}
          </div>
        </Card>
      ))}

      {modalAbierto && <ModalCrearProducto onClose={() => setModalAbierto(false)} />}
    </div>
  );
}