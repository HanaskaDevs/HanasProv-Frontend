import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Card from '../../../shared/components/Card';
import Spinner from '../../../shared/components/Spinner';
import Badge from '../../../shared/components/Badge';
import * as configuracionesApi from '../api/configuracionesApi';

/**
 * Interruptor de la suspensión automática de proveedores con documentación
 * vencida. Los AVISOS por correo no se pueden apagar desde acá a propósito:
 * avisar no rompe nada, suspender sí.
 */
export default function TabDocumentos() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['config-suspension-documentos'],
    queryFn: configuracionesApi.obtenerSuspensionDocumentos,
  });

  const cambiar = useMutation({
    mutationFn: (activa: boolean) => configuracionesApi.definirSuspensionDocumentos(activa),
    onSuccess: (nueva) => queryClient.setQueryData(['config-suspension-documentos'], nueva),
  });

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-10">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <h2 className="font-display text-base font-semibold text-brand-900 flex items-center gap-2">
              Suspensión automática por documentación vencida
              <Badge tone={data.activa ? 'success' : 'neutral'}>{data.activa ? 'Activa' : 'Apagada'}</Badge>
            </h2>
            <p className="text-sm text-brand-900/60 mt-1 max-w-2xl">
              Cuando está activa, un proveedor con documentación vencida hace más de{' '}
              <strong>{data.dias_gracia} días</strong> pasa a Suspendido y deja de poder ingresar al portal hasta que
              el administrador lo reactive. Con el interruptor apagado se siguen enviando todos los avisos por correo,
              pero <strong>nadie queda suspendido</strong> automáticamente.
            </p>
          </div>

          {/* Interruptor tipo switch, con los colores de marca. */}
          <button
            type="button"
            role="switch"
            aria-checked={data.activa}
            disabled={cambiar.isPending}
            onClick={() => cambiar.mutate(!data.activa)}
            className={`relative shrink-0 h-7 w-12 rounded-full transition-colors disabled:opacity-50 ${
              data.activa ? 'bg-emerald-600' : 'bg-brand-900/20'
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                data.activa ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>

        {cambiar.isError && (
          <p className="text-xs text-brand-wine mt-3">No se pudo cambiar la configuración. Intentá de nuevo.</p>
        )}
      </Card>

      <Card>
        <h3 className="font-display text-sm font-semibold text-brand-900 mb-3">Cómo funciona el ciclo</h3>
        <div className="space-y-2.5">
          {[
            {
              titulo: `${data.dias_primer_aviso} días antes del vencimiento`,
              texto: 'Primer aviso por correo al proveedor y a los usuarios de Calidad y Admin de la empresa.',
              tono: 'bg-brand-700',
            },
            {
              titulo: `Cada ${data.dias_entre_avisos} días`,
              texto: 'Se reitera el aviso mientras el documento no se reemplace.',
              tono: 'bg-brand-700',
            },
            {
              titulo: 'Día del vencimiento',
              texto: 'El proveedor todavía puede ingresar y cargar el documento actualizado.',
              tono: 'bg-brand-yellow',
            },
            {
              titulo: `${data.dias_gracia} días después del vencimiento`,
              texto: data.activa
                ? 'El proveedor de esa empresa queda Suspendido y no puede ingresar hasta que el administrador lo reactive.'
                : 'Con el interruptor apagado, no se suspende a nadie (solo quedan los avisos).',
              tono: data.activa ? 'bg-brand-wine' : 'bg-brand-900/20',
            },
          ].map((paso) => (
            <div key={paso.titulo} className="flex items-start gap-3">
              <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${paso.tono}`} />
              <div>
                <p className="text-sm font-medium text-brand-900">{paso.titulo}</p>
                <p className="text-xs text-brand-900/55">{paso.texto}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-brand-900/40 mt-4">
          La suspensión afecta solo al proveedor de la empresa dueña del documento. Si el mismo usuario trabaja con
          otra empresa del grupo y ahí está al día, sigue ingresando a esa con normalidad.
        </p>
      </Card>
    </div>
  );
}
