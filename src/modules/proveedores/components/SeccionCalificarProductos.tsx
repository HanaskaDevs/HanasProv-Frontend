// src/modules/proveedores/components/SeccionCalificarProductos.tsx
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import * as proveedoresApi from '../api/proveedoresApi';
import type { DocumentoProductoCalificable, ProductoCalificable, ProductosCalificacion } from '../types';
import ControlesCalificacion from './ControlesCalificacion';
import ModalVisorPdf from './ModalVisorPdf';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import Badge from '../../../shared/components/Badge';
import Spinner from '../../../shared/components/Spinner';
import Modal from '../../../shared/components/Modal';

function IconoCaja({ className = '' }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
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

/** Detalle organizado de los productos rechazados -> lo que se ve al pulsar "Más información". */
function ModalDetalleRechazoProductos({
  productos,
  onClose,
}: {
  productos: ProductoCalificable[];
  onClose: () => void;
}) {
  return (
    <Modal onClose={onClose} title={`Productos rechazados (${productos.length})`} maxWidth="max-w-lg">
      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
        {productos.map((producto) => (
          <div key={producto.id_producto} className="rounded-lg border border-brand-wine/15 bg-brand-wine/[0.03] p-3">
            <p className="text-xs font-semibold text-brand-900">{producto.nombre_producto}</p>
            <p className="text-sm text-brand-900/75 mt-1">{producto.comentario_calificacion}</p>
          </div>
        ))}
      </div>
    </Modal>
  );
}

function TarjetaProducto({
  producto,
  idProveedor,
  soloLectura,
  onVerDocumento,
}: {
  producto: ProductoCalificable;
  idProveedor: number;
  soloLectura: boolean;
  onVerDocumento: (doc: DocumentoProductoCalificable) => void;
}) {
  const queryClient = useQueryClient();

  const calificar = useMutation({
    mutationFn: (payload: { aprobado: boolean; observacion?: string }) =>
      proveedoresApi.calificarProducto(producto.id_producto, payload),
    onSuccess: (resultado) => {
      // Igual que en Documentos: el POST ya devuelve el estado
      // actualizado de ESE producto -> directo al caché, sin depender
      // de un segundo viaje al servidor.
      queryClient.setQueryData<ProductosCalificacion | undefined>(
        ['calificacion-productos', idProveedor],
        (actual) => {
          if (!actual) return actual;
          return {
            ...actual,
            productos: actual.productos.map((p) =>
              p.id_producto === resultado.id_producto ? { ...p, ...resultado } : p
            ),
          };
        }
      );
      queryClient.invalidateQueries({ queryKey: ['proveedores-lista'] });
    },
  });

  const chip =
    producto.estado_calificacion === 'Aprobado'
      ? 'bg-emerald-100 text-emerald-600'
      : producto.estado_calificacion === 'Rechazado'
        ? 'bg-brand-wine/10 text-brand-wine'
        : 'bg-brand-900/6 text-brand-900/40';

  return (
    <div className="h-full flex flex-col rounded-xl border border-brand-900/20 bg-white shadow-sm p-3 space-y-2">
      <div className="flex items-start gap-2.5">
        <span className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${chip}`}>
          <IconoCaja />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-brand-900 truncate" title={producto.nombre_producto}>
            {producto.nombre_producto}
          </p>
          <p className="text-[10.5px] text-brand-900/50">
            {producto.unidad_presentacion ?? '—'}
            {producto.precio && ` · $${producto.precio}`}
            {producto.codigo_barras && ` · ${producto.codigo_barras}`}
          </p>
        </div>
      </div>

      {producto.documentos.length === 0 ? (
        <p className="text-[11px] text-brand-900/35 italic">Sin documentos cargados.</p>
      ) : (
        <div className="space-y-1">
          {producto.documentos.map((doc) => (
            <button
              key={doc.id_documento_producto}
              onClick={() => onVerDocumento(doc)}
              className="w-full flex items-center justify-between gap-2 rounded-md bg-brand-700/[0.04] px-2 py-1
                text-left hover:bg-brand-700/10 transition-colors"
            >
              <span className="min-w-0 text-[11px] text-brand-900/70 truncate">{doc.nombre_documento}</span>
              <span className="shrink-0 inline-flex items-center gap-1 text-[10.5px] font-medium text-brand-700">
                <IconoOjo /> Ver
              </span>
            </button>
          ))}
        </div>
      )}

      {/* mt-auto -> sin importar si el producto tiene 2 o 3 documentos
          (o ninguno), esto siempre queda pegado al fondo de la tarjeta,
          alineado con las tarjetas vecinas de la misma fila. */}
      <div className="pt-1 border-t border-brand-900/6 mt-auto">
        <ControlesCalificacion
          estado={producto.estado_calificacion}
          observacion={producto.comentario_calificacion}
          fecha={producto.fecha_calificacion}
          calificando={calificar.isPending}
          soloLectura={soloLectura}
          onCalificar={(aprobado, observacion) => calificar.mutate({ aprobado, observacion })}
        />
      </div>
    </div>
  );
}

/**
 * Calificación de Productos: mismo patrón que Documentos -> tarjeta por
 * producto, ✓/✗ con observación obligatoria al rechazar, y una franja
 * de "Registrar calificación" que exige calificar TODOS los que están
 * en revisión antes de poder confirmar. Una vez registrada, la sección
 * pasa a ser de solo consulta hasta que se reabra.
 */
export default function SeccionCalificarProductos({ idProveedor }: { idProveedor: number }) {
  const queryClient = useQueryClient();
  const [documentoEnVisor, setDocumentoEnVisor] = useState<DocumentoProductoCalificable | null>(null);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['calificacion-productos', idProveedor],
    queryFn: () => proveedoresApi.obtenerProductosCalificacion(idProveedor),
  });

  const registrar = useMutation({
    mutationFn: () => proveedoresApi.registrarCalificacionProductos(idProveedor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calificacion-productos', idProveedor] });
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

  if (data.productos.length === 0) {
    return (
      <Card>
        <p className="text-sm text-brand-900/50 text-center py-8">
          Este proveedor todavía no registró productos para calificar.
        </p>
      </Card>
    );
  }

  const totalCalificados = data.productos.filter(
    (p) => p.estado_calificacion === 'Aprobado' || p.estado_calificacion === 'Rechazado'
  ).length;
  const faltanPorCalificar = data.productos.length - totalCalificados;
  const productosRechazados = data.productos.filter((p) => p.estado_calificacion === 'Rechazado');

  const registrada = data.calificacion_productos_registrada;
  const hayRechazados = productosRechazados.length > 0;

  return (
    <div className="space-y-3">
      <Card className="!p-3">
        {registrada ? (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <Badge tone="info">Productos Calificados</Badge>
              <p className="text-xs text-brand-900/55">
                {hayRechazados
                  ? 'Pendiente de correcciones por parte del aspirante.'
                  : 'Aprobados. No hay nada más que hacer aquí.'}
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
                ? `Te falta calificar ${faltanPorCalificar} de ${data.productos.length} producto(s).`
                : `Ya calificaste los ${data.productos.length} producto(s) en revisión.`}
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

      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-brand-900/50">{data.productos.length} producto(s) registrado(s)</p>
        <p className="text-xs font-medium text-brand-900/60">
          {totalCalificados}/{data.productos.length} calificados
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {data.productos.map((producto) => (
          <TarjetaProducto
            key={producto.id_producto}
            producto={producto}
            idProveedor={idProveedor}
            soloLectura={registrada}
            onVerDocumento={setDocumentoEnVisor}
          />
        ))}
      </div>

      {documentoEnVisor && (
        <ModalVisorPdf
          idDocumento={documentoEnVisor.id_documento_producto}
          nombre={documentoEnVisor.nombre_original}
          obtenerUrl={proveedoresApi.obtenerUrlVisorDocumentoProducto}
          onClose={() => setDocumentoEnVisor(null)}
        />
      )}

      {modalDetalleAbierto && (
        <ModalDetalleRechazoProductos productos={productosRechazados} onClose={() => setModalDetalleAbierto(false)} />
      )}
    </div>
  );
}