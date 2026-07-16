import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as proveedoresApi from '../api/proveedoresApi';
import CamposFichaSoloLectura from '../../miFicha/components/CamposFichaSoloLectura';
import ControlesCalificacion from './ControlesCalificacion';
import Card from '../../../shared/components/Card';
import Spinner from '../../../shared/components/Spinner';

/**
 * Ficha completa en solo lectura (mismo componente que usa el propio
 * proveedor para ver "su" ficha) + el bloque de calificación arriba,
 * bien visible, para que el admin no tenga que bajar hasta el final del
 * formulario para calificar.
 */
export default function SeccionCalificarFicha({ idProveedor }: { idProveedor: number }) {
  const queryClient = useQueryClient();

  const { data: ficha, isLoading } = useQuery({
    queryKey: ['calificacion-ficha', idProveedor],
    queryFn: () => proveedoresApi.obtenerFichaCalificacion(idProveedor),
  });

  const calificar = useMutation({
    mutationFn: (payload: { aprobado: boolean; observacion?: string }) =>
      proveedoresApi.calificarFicha(idProveedor, payload),
    onSuccess: (fichaActualizada) => {
      // El propio POST ya devuelve la ficha completa actualizada -> la
      // escribimos directo en el caché en vez de invalidar y esperar un
      // segundo viaje al servidor solo para volver a traer lo mismo.
      queryClient.setQueryData(['calificacion-ficha', idProveedor], fichaActualizada);
      // La tabla de proveedores sí necesita refrescarse (badges de
      // calificación), pero eso no bloquea la UI de este modal.
      queryClient.invalidateQueries({ queryKey: ['proveedores-lista'] });
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

  return (
    <div className="space-y-4">
      <Card className={fichaIncompleta ? 'bg-brand-yellow/10 border-brand-yellow/30' : 'bg-brand-200/10'}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-medium text-brand-900">Calificación de la Ficha</p>
            <p className="text-xs text-brand-900/55 mt-0.5">
              {fichaIncompleta
                ? `El proveedor todavía no completó su ficha (${ficha.porcentaje_completado}%).`
                : 'Visto = Aprobado (100). X = Rechazado (0), con observación para el proveedor.'}
            </p>
          </div>
          {!fichaIncompleta && (
            <ControlesCalificacion
              estado={ficha.calificacion_ficha.estado}
              observacion={ficha.calificacion_ficha.observacion}
              fecha={ficha.calificacion_ficha.fecha}
              calificando={calificar.isPending}
              onCalificar={(aprobado, observacion) => calificar.mutate({ aprobado, observacion })}
            />
          )}
        </div>
        {calificar.isError && (
          <p className="text-xs text-brand-wine mt-2">No se pudo guardar la calificación. Intenta de nuevo.</p>
        )}
      </Card>

      <CamposFichaSoloLectura ficha={ficha} />
    </div>
  );
}