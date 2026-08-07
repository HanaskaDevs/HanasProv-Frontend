// src/modules/cambiosPrecio/pages/CambiosPrecioPage.tsx
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as productosApi from '../../fichaProductos/api/productosApi';
import type { SolicitudCambioPrecio } from '../../fichaProductos/types';
import { useAuth } from '../../auth/hooks/useAuth';
import RoleRoute from '../../../routes/RoleRoute';
import Card from '../../../shared/components/Card';
import Badge from '../../../shared/components/Badge';
import Button from '../../../shared/components/Button';
import Spinner from '../../../shared/components/Spinner';

function formatearFecha(fecha: string): string {
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function FilaSolicitud({ solicitud }: { solicitud: SolicitudCambioPrecio }) {
  const queryClient = useQueryClient();
  const [rechazando, setRechazando] = useState(false);
  const [motivo, setMotivo] = useState('');

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ['cambios-precio-pendientes'] });

  const aprobar = useMutation({
    mutationFn: () => productosApi.aprobarCambioPrecio(solicitud.id_solicitud_cambio_precio),
    onSuccess: invalidar,
  });

  const rechazar = useMutation({
    mutationFn: () => productosApi.rechazarCambioPrecio(solicitud.id_solicitud_cambio_precio, motivo || undefined),
    onSuccess: () => {
      setRechazando(false);
      invalidar();
    },
  });

  return (
    <div className="px-5 py-4 border-b border-brand-900/8 last:border-b-0">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-semibold text-brand-900">{solicitud.producto.nombre_producto}</p>
          <p className="text-xs text-brand-900/50">
            {solicitud.proveedor?.razon_social ?? 'Proveedor'} · Solicitado por {solicitud.solicitante.nombre_completo} ·{' '}
            {formatearFecha(solicitud.fecha_solicitud)}
          </p>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <span className="text-brand-900/50 line-through">${solicitud.precio_anterior}</span>
          <span aria-hidden>→</span>
          <span className="font-semibold text-brand-900">${solicitud.precio_nuevo}</span>
        </div>
      </div>

      {!rechazando ? (
        <div className="flex justify-end gap-2 mt-3">
          <Button
            variant="secondary"
            className="text-brand-wine !text-xs !px-3 !py-1.5"
            onClick={() => setRechazando(true)}
            disabled={aprobar.isPending || rechazar.isPending}
          >
            Rechazar
          </Button>
          <Button
            className="!text-xs !px-3 !py-1.5"
            isLoading={aprobar.isPending}
            onClick={() => aprobar.mutate()}
          >
            Aprobar
          </Button>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Motivo del rechazo (opcional)"
            rows={2}
            className="w-full rounded-md border border-brand-900/15 px-3 py-2 text-sm resize-none"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" className="!text-xs !px-3 !py-1.5" onClick={() => setRechazando(false)}>
              Cancelar
            </Button>
            <Button
              variant="secondary"
              className="text-brand-wine !text-xs !px-3 !py-1.5"
              isLoading={rechazar.isPending}
              onClick={() => rechazar.mutate()}
            >
              Confirmar rechazo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ListadoCambiosPrecio() {
  const { data, isLoading } = useQuery({
    queryKey: ['cambios-precio-pendientes'],
    queryFn: productosApi.listarCambiosPrecioPendientes,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  const solicitudes = data ?? [];

  return (
    <Card className="max-w-3xl mx-auto !p-0 overflow-hidden">
      {solicitudes.length === 0 ? (
        <p className="text-sm text-brand-900/60 text-center py-10">No hay cambios de precio pendientes.</p>
      ) : (
        solicitudes.map((s) => <FilaSolicitud key={s.id_solicitud_cambio_precio} solicitud={s} />)
      )}
    </Card>
  );
}

export default function CambiosPrecioPage() {
  const { esAdmin, esCalidad, esSistemas } = useAuth();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5 max-w-3xl mx-auto">
        <h1 className="font-display text-xl font-semibold text-brand-900">Cambios de Precio</h1>
        <Badge tone="info">Pendientes de aprobación</Badge>
      </div>

      <RoleRoute allow={esAdmin || esCalidad || esSistemas}>
        <ListadoCambiosPrecio />
      </RoleRoute>
    </div>
  );
}
