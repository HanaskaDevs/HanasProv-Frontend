// src/modules/proveedores/components/SeccionCalificarFicha.tsx
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import * as proveedoresApi from '../api/proveedoresApi';
import type { CampoRechazado } from '../api/proveedoresApi';
import ModalSeleccionarCamposRechazados from './ModalSeleccionarCamposRechazados';
import CamposFichaSoloLectura from '../../miFicha/components/CamposFichaSoloLectura';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import Spinner from '../../../shared/components/Spinner';
import Badge from '../../../shared/components/Badge';
import Modal from '../../../shared/components/Modal';
import { ETIQUETAS_CAMPOS_FICHA, type CampoFichaCalificable } from '../../../shared/constants/camposFichaProveedor';

type CalificacionCampo = { estado: string; observacion: string | null; fecha: string | null };

/** Detalle organizado de los campos rechazados -> lo que se ve al pulsar "Más información". */
function ModalDetalleRechazo({
  campos,
  onClose,
}: {
  campos: [CampoFichaCalificable, CalificacionCampo][];
  onClose: () => void;
}) {
  return (
    <Modal onClose={onClose} title={`Campos rechazados (${campos.length})`} maxWidth="max-w-lg">
      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
        {campos.map(([campo, c]) => (
          <div key={campo} className="rounded-lg border border-brand-wine/15 bg-brand-wine/[0.03] p-3">
            <p className="text-xs font-semibold text-brand-900">{ETIQUETAS_CAMPOS_FICHA[campo]}</p>
            <p className="text-sm text-brand-900/75 mt-1">{c.observacion}</p>
          </div>
        ))}
      </div>
    </Modal>
  );
}

/**
 * Calificación GENERAL: el admin ve toda la ficha (solo lectura) y
 * decide Aprobar o Rechazar de una. Al Rechazar se abre
 * ModalSeleccionarCamposRechazados para elegir qué campos están mal +
 * su observación, todo se registra junto.
 *
 * Una vez calificada (Aprobada o Rechazada), esta vista pasa a ser de
 * solo consulta -> no hay más acciones hasta que el proveedor corrija lo
 * señalado (eso reabre los campos rechazados automáticamente en el
 * backend, y ahí sí vuelve a aparecer el bloque de Aprobar/Rechazar).
 */
export default function SeccionCalificarFicha({ idProveedor }: { idProveedor: number }) {
  const queryClient = useQueryClient();
  const [modalRechazoAbierto, setModalRechazoAbierto] = useState(false);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);

  const { data: ficha, isLoading } = useQuery({
    queryKey: ['calificacion-ficha', idProveedor],
    queryFn: () => proveedoresApi.obtenerFichaCalificacion(idProveedor),
  });

  const calificar = useMutation({
    mutationFn: (payload: proveedoresApi.PayloadCalificarFichaGeneral) =>
      proveedoresApi.calificarFichaGeneral(idProveedor, payload),
    onSuccess: (fichaActualizada) => {
      // La respuesta ya trae la ficha completa actualizada -> directo al
      // caché, sin depender de un segundo viaje al servidor.
      queryClient.setQueryData(['calificacion-ficha', idProveedor], fichaActualizada);
      queryClient.invalidateQueries({ queryKey: ['proveedores-lista'] });
      setModalRechazoAbierto(false);
    },
  });

  if (isLoading || !ficha) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  const fichaIncompleta = Number(ficha.porcentaje_completado) < 100;

  if (fichaIncompleta) {
    return (
      <Card className="bg-brand-yellow/10 border-brand-yellow/30">
        <p className="text-sm text-brand-900">
          El proveedor todavía no completó su ficha ({ficha.porcentaje_completado}%). Todavía no hay nada que
          calificar.
        </p>
      </Card>
    );
  }

  const yaCalificada = ficha.estado_calificacion_general !== null;
  const rechazada = ficha.estado_calificacion_general === 'Rechazado';
  const camposRechazados = Object.entries(ficha.calificaciones_campos).filter(
    ([, c]) => c.estado === 'Rechazado'
  ) as [CampoFichaCalificable, CalificacionCampo][];

  function handleConfirmarRechazo(campos: CampoRechazado[]) {
    calificar.mutate({ aprobado: false, campos_rechazados: campos });
  }

  return (
    <div className="space-y-3">
      <Card className={`!p-3 ${yaCalificada ? '' : 'bg-brand-700/5 border-brand-700/15'}`}>
        {yaCalificada ? (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <Badge tone="info">Ficha Calificada</Badge>
              <p className="text-xs text-brand-900/55">
                {rechazada
                  ? 'Pendiente de correcciones por parte del aspirante.'
                  : 'Aprobada. No hay nada más que hacer aquí.'}
              </p>
            </div>
            {rechazada && camposRechazados.length > 0 && (
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
            <p className="text-xs text-brand-900/60 max-w-2xl">
              En esta pestaña podrás revisar la información registrada por el proveedor aspirante. Una vez
              verificada, podrás aprobar o rechazar la ficha. Recuerda que, en caso de rechazo, deberás dejar los
              comentarios correspondientes para el aspirante.
            </p>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="ghost"
                className="!text-brand-wine hover:!bg-brand-wine/10"
                onClick={() => setModalRechazoAbierto(true)}
                disabled={calificar.isPending}
              >
                Rechazar
              </Button>
              <Button
                variant="primary"
                onClick={() => calificar.mutate({ aprobado: true })}
                isLoading={calificar.isPending}
              >
                Aprobar ficha
              </Button>
            </div>
          </div>
        )}
        {calificar.isError && (
          <p className="text-xs text-brand-wine mt-2">
            {axios.isAxiosError(calificar.error) && calificar.error.response?.data?.errors
              ? Object.values(calificar.error.response.data.errors).flat().join(' ')
              : 'No se pudo guardar la calificación. Intenta de nuevo.'}
          </p>
        )}
      </Card>

      <CamposFichaSoloLectura ficha={ficha} />

      {modalRechazoAbierto && (
        <ModalSeleccionarCamposRechazados
          ficha={ficha}
          enviando={calificar.isPending}
          error={
            calificar.isError && axios.isAxiosError(calificar.error) && calificar.error.response?.data?.message
              ? calificar.error.response.data.message
              : null
          }
          onConfirmar={handleConfirmarRechazo}
          onClose={() => setModalRechazoAbierto(false)}
        />
      )}

      {modalDetalleAbierto && (
        <ModalDetalleRechazo campos={camposRechazados} onClose={() => setModalDetalleAbierto(false)} />
      )}
    </div>
  );
}