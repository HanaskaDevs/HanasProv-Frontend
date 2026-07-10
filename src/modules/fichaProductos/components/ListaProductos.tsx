import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as productosApi from '../api/productosApi';
import type { Producto } from '../types';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import Spinner from '../../../shared/components/Spinner';
import BarraBusqueda from '../../../shared/components/BarraBusqueda';
import Paginacion from '../../../shared/components/Paginacion';
import ModalCrearProducto from './ModalCrearProducto';

const TAMANO_MAXIMO_MB = 4;
const PRODUCTOS_POR_PAGINA = 20;

const TIPOS_DOCUMENTO = [
  { id: 1, slug: 'ficha-tecnica', etiqueta: 'Ficha técnica', obligatorio: true },
  { id: 2, slug: 'analisis-producto', etiqueta: 'Análisis de producto', obligatorio: true },
  { id: 3, slug: 'carta-alergenos', etiqueta: 'Carta de alérgenos', obligatorio: false },
] as const;

function CasillaDocumento({ producto, tipo }: { producto: Producto; tipo: (typeof TIPOS_DOCUMENTO)[number] }) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const yaSubido = producto.documentos.find((d) => d.tipo === tipo.slug);

  const subir = useMutation({
    mutationFn: (archivo: File) => productosApi.subirDocumentoProducto(producto.id_producto, tipo.id, archivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mis-productos'] });
      setError(null);
    },
    onError: () => setError('No se pudo subir. Verifica que sea PDF y pese menos de 4MB.'),
  });

  const ver = useMutation({
    mutationFn: (idDocumentoProducto: number) => productosApi.verDocumentoProducto(idDocumentoProducto),
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

    setError(null);
    subir.mutate(archivo);
  }

  return (
    <div className="min-w-0 flex-1">
      <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={handleSeleccionar} />

      {yaSubido ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2">
          <p className="text-xs font-medium text-emerald-800 flex items-center gap-1">✓ {tipo.etiqueta}</p>
          <p className="text-[11px] text-emerald-700/70 truncate" title={yaSubido.nombre_original}>
            {yaSubido.nombre_original}
          </p>
          <div className="flex gap-3 mt-1">
            <button
              onClick={() => ver.mutate(yaSubido.id_documento_producto)}
              className="text-[11px] font-medium text-brand-700 hover:underline"
            >
              Ver
            </button>
            <button
              onClick={() => inputRef.current?.click()}
              disabled={subir.isPending}
              className="text-[11px] font-medium text-brand-900/50 hover:underline"
            >
              Reemplazar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={subir.isPending}
          className={`w-full rounded-md border-2 border-dashed px-3 py-2 text-left transition-colors
            ${
              tipo.obligatorio
                ? 'border-brand-wine/30 hover:border-brand-wine/60 hover:bg-brand-wine/5'
                : 'border-brand-900/15 hover:border-brand-900/30 hover:bg-brand-900/5'
            }`}
        >
          <p className="text-xs font-medium text-brand-900">
            {subir.isPending ? <Spinner className="h-3 w-3 inline mr-1" /> : null}
            Cargue aquí {tipo.etiqueta.toLowerCase()}
            {tipo.obligatorio && <span className="text-brand-wine"> *</span>}
          </p>
          <p className="text-[11px] text-brand-900/40">PDF, máx. 4MB</p>
        </button>
      )}

      {error && <span className="text-[10px] text-brand-wine block mt-1">{error}</span>}
    </div>
  );
}

function TarjetaProducto({ producto }: { producto: Producto }) {
  return (
    <Card>
      <div>
        <p className="font-medium text-brand-900">{producto.nombre_producto}</p>
        <p className="text-xs text-brand-900/50 mt-0.5">
          {producto.codigo_barras ?? 'Sin código de barras'} · {producto.unidad_presentacion}
          {producto.precio != null && ` · $${producto.precio}`}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-brand-900/8">
        {TIPOS_DOCUMENTO.map((tipo) => (
          <CasillaDocumento key={tipo.id} producto={producto} tipo={tipo} />
        ))}
      </div>
    </Card>
  );
}

export default function ListaProductos() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['mis-productos'],
    queryFn: productosApi.listarProductos,
  });

  const productosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return (data ?? []).filter(
      (p) =>
        !texto ||
        p.nombre_producto.toLowerCase().includes(texto) ||
        (p.codigo_barras?.toLowerCase().includes(texto) ?? false)
    );
  }, [data, busqueda]);

  const totalPaginas = Math.max(1, Math.ceil(productosFiltrados.length / PRODUCTOS_POR_PAGINA));

  const productosPagina = useMemo(() => {
    const inicio = (pagina - 1) * PRODUCTOS_POR_PAGINA;
    return productosFiltrados.slice(inicio, inicio + PRODUCTOS_POR_PAGINA);
  }, [productosFiltrados, pagina]);

  useEffect(() => {
    setPagina(1);
  }, [busqueda]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <BarraBusqueda valor={busqueda} onCambiar={setBusqueda} placeholder="Buscar producto o código de barras..." />
        <Button onClick={() => setModalAbierto(true)}>+ Agregar producto</Button>
      </div>

      {productosFiltrados.length === 0 ? (
        <Card>
          <p className="text-sm text-brand-900/60 text-center py-10">
            {data?.length === 0 ? 'Todavía no has agregado ningún producto.' : 'Sin resultados para tu búsqueda.'}
          </p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {productosPagina.map((producto) => (
              <TarjetaProducto key={producto.id_producto} producto={producto} />
            ))}
          </div>

          <Paginacion paginaActual={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
        </>
      )}

      {modalAbierto && <ModalCrearProducto onClose={() => setModalAbierto(false)} />}
    </div>
  );
}