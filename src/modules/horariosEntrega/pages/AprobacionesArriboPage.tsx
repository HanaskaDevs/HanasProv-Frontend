import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/hooks/useAuth';
import * as horariosEntregaApi from '../api/horariosEntregaApi';
import type { SolicitudAprobacionArribo } from '../types';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import Spinner from '../../../shared/components/Spinner';
import Modal from '../../../shared/components/Modal';
import RoleRoute from '../../../routes/RoleRoute';

/**
 * Bandeja de Calidad: solicitudes de arribo tardío pendientes de resolver.
 * Pedido explícito del usuario, 26-ago-2026: "solo ella va a tener ese
 * control de aprobación" (Calidad + Sistemas como respaldo, igual que el
 * backend en HorarioEntregaService::verificarAccesoResolverAprobacion) -
 * el aviso de que hay una solicitud nueva llega por correo, esta pantalla
 * es donde se resuelve.
 */
function TarjetaSolicitud({
  solicitud,
  onAprobar,
  onRechazar,
  cargando,
}: {
  solicitud: SolicitudAprobacionArribo;
  onAprobar: () => void;
  onRechazar: () => void;
  cargando: boolean;
}) {
  return (
    <Card className="p-0 overflow-hidden">
      <div className="p-4 space-y-3">
        <div>
          <p className="font-semibold text-brand-900">{solicitud.nombre_proveedor ?? 'Proveedor'}</p>
          <p className="text-xs text-brand-900/50">Hora programada {solicitud.hora_llegada}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-[11px] uppercase text-brand-900/40">Solicitado por</p>
            <p>{solicitud.solicitado_por ?? '—'}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase text-brand-900/40">Fecha de solicitud</p>
            <p className="tabular-nums">{solicitud.fecha_solicitud}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button className="flex-1 min-h-11" onClick={onAprobar} isLoading={cargando}>
            Aprobar arribo
          </Button>
          <Button variant="secondary" className="flex-1 min-h-11" onClick={onRechazar} disabled={cargando}>
            Rechazar
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ModalMotivoRechazo({
  onCancelar,
  onConfirmar,
  cargando,
}: {
  onCancelar: () => void;
  onConfirmar: (motivo: string) => void;
  cargando: boolean;
}) {
  const [motivo, setMotivo] = useState('');

  return (
    <Modal onClose={onCancelar} title="Rechazar solicitud de arribo" maxWidth="max-w-md">
      <div className="space-y-4">
        <p className="text-sm text-brand-900/70">
          El horario queda en Rechazado en firme. Puedes explicar el motivo (opcional).
        </p>
        <textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          rows={3}
          className="w-full border border-brand-900/15 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-700/30"
          placeholder="Motivo del rechazo (opcional)"
        />
        <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
          <Button variant="ghost" className="min-h-11 w-full sm:w-auto" onClick={onCancelar} disabled={cargando}>
            Cancelar
          </Button>
          <Button className="min-h-11 w-full sm:w-auto" isLoading={cargando} onClick={() => onConfirmar(motivo)}>
            Confirmar rechazo
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function AprobacionesContenido() {
  const queryClient = useQueryClient();
  const [solicitudParaRechazar, setSolicitudParaRechazar] = useState<SolicitudAprobacionArribo | null>(null);

  const { data: solicitudes, isLoading } = useQuery({
    queryKey: ['horarios-entrega-aprobaciones'],
    queryFn: horariosEntregaApi.listarSolicitudesAprobacion,
    refetchInterval: 30_000,
  });

  const aprobar = useMutation({
    mutationFn: (id: number) => horariosEntregaApi.aprobarSolicitud(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['horarios-entrega-aprobaciones'] }),
  });

  const rechazar = useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo?: string }) => horariosEntregaApi.rechazarSolicitud(id, motivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horarios-entrega-aprobaciones'] });
      setSolicitudParaRechazar(null);
    },
  });

  return (
    <div className="max-w-3xl mx-auto w-full space-y-4">
      <div>
        <h1 className="font-display text-xl font-semibold text-brand-900">Solicitudes de aprobación de arribo</h1>
        <p className="text-brand-900/50 text-xs mt-0.5">
          Horarios que pasaron a Rechazado y el Guardia pide igual registrar el arribo.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-6 w-6" />
        </div>
      ) : (solicitudes ?? []).length === 0 ? (
        <Card>
          <p className="text-sm text-brand-900/60 text-center py-10">No hay solicitudes pendientes.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {(solicitudes ?? []).map((s) => (
            <TarjetaSolicitud
              key={s.id_solicitud_aprobacion_arribo}
              solicitud={s}
              cargando={aprobar.isPending && aprobar.variables === s.id_solicitud_aprobacion_arribo}
              onAprobar={() => aprobar.mutate(s.id_solicitud_aprobacion_arribo)}
              onRechazar={() => setSolicitudParaRechazar(s)}
            />
          ))}
        </div>
      )}

      {solicitudParaRechazar && (
        <ModalMotivoRechazo
          cargando={rechazar.isPending}
          onCancelar={() => setSolicitudParaRechazar(null)}
          onConfirmar={(motivo) =>
            rechazar.mutate({ id: solicitudParaRechazar.id_solicitud_aprobacion_arribo, motivo: motivo || undefined })
          }
        />
      )}
    </div>
  );
}

export default function AprobacionesArriboPage() {
  const { esSistemas, esCalidad } = useAuth();

  return (
    <RoleRoute allow={esSistemas || esCalidad}>
      <AprobacionesContenido />
    </RoleRoute>
  );
}
