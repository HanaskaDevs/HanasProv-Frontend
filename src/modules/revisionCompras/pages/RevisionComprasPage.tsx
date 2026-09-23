import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../auth/hooks/useAuth';
import RoleRoute from '../../../routes/RoleRoute';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import Badge from '../../../shared/components/Badge';
import Spinner from '../../../shared/components/Spinner';
import BarraBusqueda from '../../../shared/components/BarraBusqueda';
import * as productosApi from '../../fichaProductos/api/productosApi';
import ModalDocumentosProducto from '../../fichaProductos/components/ModalDocumentosProducto';
import ModalMotivoRevision from '../components/ModalMotivoRevision';
import type { Producto } from '../../fichaProductos/types';

function nombreProveedor(producto: Producto): string {
  return (
    producto.proveedor?.nombre_comercial?.trim() ||
    producto.proveedor?.razon_social?.trim() ||
    'Proveedor sin razón social'
  );
}

/**
 * BANDEJA DE COMPRAS — primer paso del circuito de aprobación de productos
 * (23-sep-2026).
 *
 *     proveedor envía  ->  COMPRAS  ->  Calidad  ->  aprobado
 *
 * Compras mira antes que nadie: revisa los datos y los documentos, y
 * decide. Las tres salidas están acá y no repartidas por el portal, porque
 * son la misma decisión tomada sobre el mismo producto:
 *
 *   - Aprobar  -> pasa a Calidad, y a Calidad le llega el aviso.
 *   - Devolver -> vuelve al proveedor con el motivo; conserva sus
 *                 documentos y lo reenvía corregido.
 *   - Retirar  -> se va del catálogo, con el motivo.
 *
 * Para CORREGIR los datos del producto (nombre, medidas, grupos) se usa
 * "Productos por proveedor", que ya existía: acá se decide, allá se edita.
 */
function RevisionComprasContenido() {
  const queryClient = useQueryClient();
  const [busqueda, setBusqueda] = useState('');
  const [idAbierto, setIdAbierto] = useState<number | null>(null);
  const [motivoPara, setMotivoPara] = useState<{ producto: Producto; accion: 'rechazar' | 'eliminar' } | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: productos = [], isLoading } = useQuery({
    queryKey: ['productos-en-revision'],
    queryFn: productosApi.listarProductosEnRevision,
  });

  function alTerminar(mensaje: string) {
    setAviso(mensaje);
    setError(null);
    setMotivoPara(null);
    setIdAbierto(null);
    queryClient.invalidateQueries({ queryKey: ['productos-en-revision'] });
    // La lista del proveedor y la del comprador muestran el mismo producto
    // con otro estado: si no se invalidan, quedan mostrando el anterior.
    queryClient.invalidateQueries({ queryKey: ['mis-productos'] });
    queryClient.invalidateQueries({ queryKey: ['proveedores-con-productos'] });
  }

  function alFallar(e: unknown) {
    const respuesta = axios.isAxiosError(e) ? e.response?.data : null;
    const deValidacion = respuesta?.errors
      ? (Object.values(respuesta.errors).flat() as string[]).join(' ')
      : null;
    setError(deValidacion ?? respuesta?.message ?? 'No se pudo completar la acción. Intenta de nuevo.');
  }

  const aprobar = useMutation({
    mutationFn: (id: number) => productosApi.aprobarEnCompras(id),
    onSuccess: (r) => alTerminar(r.message),
    onError: alFallar,
  });

  const resolverConMotivo = useMutation({
    mutationFn: ({ id, accion, observacion }: { id: number; accion: 'rechazar' | 'eliminar'; observacion: string }) =>
      accion === 'rechazar'
        ? productosApi.rechazarEnCompras(id, observacion)
        : productosApi.eliminarEnCompras(id, observacion),
    onSuccess: (r) => alTerminar(r.message),
    onError: alFallar,
  });

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return productos;

    return productos.filter(
      (p) =>
        p.nombre_producto.toLowerCase().includes(texto) ||
        nombreProveedor(p).toLowerCase().includes(texto) ||
        (p.codigo_barras ?? '').toLowerCase().includes(texto)
    );
  }, [productos, busqueda]);

  // Agrupado por proveedor: Compras revisa "lo que mandó Cornucopia", no
  // productos sueltos de doce proveedores mezclados.
  const porProveedor = useMemo(() => {
    const mapa = new Map<string, Producto[]>();
    filtrados.forEach((p) => {
      const clave = nombreProveedor(p);
      mapa.set(clave, [...(mapa.get(clave) ?? []), p]);
    });
    return Array.from(mapa.entries()).sort(([a], [b]) => a.localeCompare(b, 'es'));
  }, [filtrados]);

  const productoAbierto = productos.find((p) => p.id_producto === idAbierto) ?? null;

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full space-y-4">
      <div>
        <h1 className="font-display text-xl font-semibold text-brand-900 flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-brand-700">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          Productos por revisar
        </h1>
        <p className="text-brand-900/50 text-xs mt-0.5">
          {productos.length === 0
            ? 'No hay productos esperando revisión.'
            : `${productos.length} producto${productos.length === 1 ? '' : 's'} esperando tu revisión antes de pasar a Calidad.`}
        </p>
      </div>

      {aviso && (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">
          {aviso}
        </p>
      )}
      {error && (
        <p className="rounded-md border border-brand-wine/20 bg-brand-wine/5 px-3 py-2 text-[13px] text-brand-wine">
          {error}
        </p>
      )}

      {productos.length > 0 && (
        <BarraBusqueda
          valor={busqueda}
          onCambiar={setBusqueda}
          placeholder="Buscar por producto, proveedor o código..."
          className="!py-1.5 !text-xs"
        />
      )}

      {filtrados.length === 0 ? (
        <Card>
          <p className="text-sm text-brand-900/55 text-center py-10">
            {productos.length === 0
              ? 'Cuando un proveedor envíe productos a aprobación, van a aparecer acá y te va a llegar un correo.'
              : 'Ningún producto coincide con la búsqueda.'}
          </p>
        </Card>
      ) : (
        porProveedor.map(([proveedor, items]) => (
          <Card key={proveedor} className="overflow-hidden p-0">
            <div className="flex items-baseline justify-between gap-2 border-b border-brand-900/8 bg-brand-900/[0.015] px-4 py-2.5">
              <h2 className="font-display text-sm font-semibold text-brand-900">{proveedor}</h2>
              <span className="text-[12px] text-brand-900/45">
                {items.length} producto{items.length === 1 ? '' : 's'}
              </span>
            </div>

            <ul className="divide-y divide-brand-900/6">
              {items.map((producto) => {
                const ocupado =
                  (aprobar.isPending && aprobar.variables === producto.id_producto) ||
                  (resolverConMotivo.isPending && resolverConMotivo.variables?.id === producto.id_producto);

                return (
                  <li key={producto.id_producto} className="flex items-center gap-3 px-4 py-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className="text-sm font-medium text-brand-900 truncate">{producto.nombre_producto}</p>
                        {producto.grupos?.map((g) => (
                          <span
                            key={g.id_grupo_producto}
                            className="shrink-0 rounded bg-brand-200 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-brand-700"
                          >
                            {g.codigo}
                          </span>
                        ))}
                      </div>
                      <p className="text-[12px] text-brand-900/50 truncate">
                        {producto.codigo_barras ?? 'Sin código de barras'} · {producto.unidad_presentacion}
                        {producto.precio != null && ` · $${producto.precio}`}
                        {` · ${producto.documentos.length} documento${producto.documentos.length === 1 ? '' : 's'}`}
                      </p>
                    </div>

                    <Badge tone="neutral">Esperando a Compras</Badge>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setIdAbierto(producto.id_producto)}
                        className="text-[12px] font-medium text-brand-700 hover:text-brand-900"
                      >
                        Ver documentos
                      </button>
                      <Button
                        className="!text-[12px] !px-2.5 !py-1"
                        isLoading={ocupado && aprobar.isPending}
                        disabled={ocupado}
                        onClick={() => aprobar.mutate(producto.id_producto)}
                      >
                        Aprobar
                      </Button>
                      <button
                        onClick={() => setMotivoPara({ producto, accion: 'rechazar' })}
                        disabled={ocupado}
                        className="text-[12px] font-medium text-amber-700 hover:text-amber-900 disabled:opacity-40"
                      >
                        Devolver
                      </button>
                      <button
                        onClick={() => setMotivoPara({ producto, accion: 'eliminar' })}
                        disabled={ocupado}
                        className="text-[12px] font-medium text-brand-wine hover:opacity-80 disabled:opacity-40"
                      >
                        Retirar
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        ))
      )}

      {productoAbierto && (
        <ModalDocumentosProducto
          producto={productoAbierto}
          correccionesPendientes={false}
          onClose={() => setIdAbierto(null)}
          onRegistrarUno={() => setIdAbierto(null)}
          onConfirmarCorreccion={() => setIdAbierto(null)}
          confirmandoCorreccion={false}
          idProveedor={productoAbierto.proveedor?.id_proveedor}
        />
      )}

      {motivoPara && (
        <ModalMotivoRevision
          accion={motivoPara.accion}
          nombreProducto={motivoPara.producto.nombre_producto}
          enviando={resolverConMotivo.isPending}
          onClose={() => setMotivoPara(null)}
          onConfirmar={(observacion) =>
            resolverConMotivo.mutate({
              id: motivoPara.producto.id_producto,
              accion: motivoPara.accion,
              observacion,
            })
          }
        />
      )}
    </div>
  );
}

/**
 * Compras (dueños del paso), Admin y Sistemas. El backend lo vuelve a
 * validar en RevisionComprasProductoService::verificarAcceso -esto es solo
 * para no dibujar una pantalla que después responde 403-.
 */
export default function RevisionComprasPage() {
  const { esCompras, esAdmin, esSistemas } = useAuth();

  return (
    <RoleRoute allow={esCompras || esAdmin || esSistemas}>
      <RevisionComprasContenido />
    </RoleRoute>
  );
}
