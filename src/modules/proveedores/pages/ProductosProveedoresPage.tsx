// src/modules/proveedores/pages/ProductosProveedoresPage.tsx
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { listarProductosProveedores, guardarCodigoBC } from '../api/productosProveedoresApi';
import useDebounce from '../../../shared/hooks/useDebounce';
import Card from '../../../shared/components/Card';
import Badge from '../../../shared/components/Badge';
import Button from '../../../shared/components/Button';
import Spinner from '../../../shared/components/Spinner';
import BarraBusqueda from '../../../shared/components/BarraBusqueda';
import Paginador from '../../../shared/components/Paginador';
import ModalImportarCodigosBC from '../components/ModalImportarCodigosBC';

function badgeDeEstado(estado: string | null) {
  if (estado === 'Aprobado') return { tone: 'success' as const, texto: 'Aprobado' };
  if (estado === 'Rechazado') return { tone: 'amber' as const, texto: 'Rechazado' };
  if (estado === 'Pendiente') return { tone: 'info' as const, texto: 'En revisión' };
  return { tone: 'neutral' as const, texto: 'Sin registrar' };
}

function CeldaCodigoBC({ idProducto, valorInicial }: { idProducto: number; valorInicial: string | null }) {
  const queryClient = useQueryClient();
  const [valor, setValor] = useState(valorInicial ?? '');

  const guardar = useMutation({
    mutationFn: (nuevoValor: string) => guardarCodigoBC(idProducto, nuevoValor),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['productos-proveedores'] }),
  });

  return (
    <input
      value={valor}
      onChange={(e) => setValor(e.target.value)}
      onBlur={() => {
        if (valor !== (valorInicial ?? '')) guardar.mutate(valor);
      }}
      placeholder="Sin asignar"
      className={`w-28 rounded-md border px-2 py-1 text-xs text-brand-900 placeholder:text-brand-900/35
        focus:outline-none focus:ring-1 focus:ring-brand-700 focus:border-brand-700
        ${guardar.isPending ? 'border-brand-700/40 bg-brand-700/5' : 'border-brand-900/15'}`}
    />
  );
}

/**
 * Búsqueda de productos entre TODOS los proveedores de la empresa
 * activa -> a diferencia de "Ficha Productos" (que es "mis productos"
 * para el propio proveedor), esto es para que Sistemas/Admin encuentre
 * un producto puntual sin saber de antemano a qué proveedor pertenece.
 */
export default function ProductosProveedoresPage() {
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [modalImportarAbierto, setModalImportarAbierto] = useState(false);
  const busquedaConDemora = useDebounce(busqueda, 400);

  useEffect(() => {
    setPagina(1);
  }, [busquedaConDemora]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['productos-proveedores', pagina, busquedaConDemora],
    queryFn: () => listarProductosProveedores(pagina, busquedaConDemora),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-xl font-semibold text-brand-900">Productos de Proveedores</h1>
          <p className="text-sm text-brand-900/60 mt-1">
            Busque un producto por nombre, código de barras o proveedor, entre todo el catálogo.
          </p>
        </div>
        <Button variant="ghost" onClick={() => setModalImportarAbierto(true)}>
          Importar Códigos BC
        </Button>
      </div>

      <BarraBusqueda
        valor={busqueda}
        onCambiar={setBusqueda}
        placeholder="Buscar por nombre de producto, código de barras o proveedor..."
      />

      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : !data || data.data.length === 0 ? (
          <p className="text-center text-sm text-brand-900/50 py-12">
            {busquedaConDemora
              ? 'No se encontraron productos que coincidan con la búsqueda.'
              : 'Todavía no hay productos registrados en esta empresa.'}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-brand-200/30 text-left text-brand-900/70">
              <tr>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">Proveedor</th>
                <th className="px-4 py-3 font-medium">Código de barras</th>
                <th className="px-4 py-3 font-medium">Código BC</th>
                <th className="px-4 py-3 font-medium">Unidad</th>
                <th className="px-4 py-3 font-medium">Precio</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-900/8">
              {data.data.map((p) => {
                const estado = badgeDeEstado(p.estado_calificacion);
                return (
                  <tr key={p.id_producto}>
                    <td className="px-4 py-3 text-brand-900">{p.nombre_producto}</td>
                    <td className="px-4 py-3 text-brand-900/70">
                      {p.proveedor?.nombre_comercial ?? p.proveedor?.razon_social ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-brand-900/60">{p.codigo_barras ?? '—'}</td>
                    <td className="px-4 py-3">
                      <CeldaCodigoBC idProducto={p.id_producto} valorInicial={p.codigo_bc} />
                    </td>
                    <td className="px-4 py-3 text-brand-900/60">{p.unidad_presentacion ?? '—'}</td>
                    <td className="px-4 py-3 text-brand-900/60">
                      {p.precio != null ? `$${Number(p.precio).toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={estado.tone}>{estado.texto}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {data && data.meta.last_page > 1 && (
        <div className={isFetching ? 'opacity-50 transition-opacity' : ''}>
          <Paginador pagina={pagina} totalPaginas={data.meta.last_page} onCambiar={setPagina} />
        </div>
      )}

      {modalImportarAbierto && <ModalImportarCodigosBC onClose={() => setModalImportarAbierto(false)} />}
    </div>
  );
}