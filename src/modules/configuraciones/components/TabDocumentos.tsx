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
/** "2027-01-01" -> "1 de enero de 2027". Se parte el texto en vez de usar
 *  new Date(): una fecha suelta se interpreta como UTC y retrocede un día. */
function formatearFecha(fecha: string): string {
  const MESES = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];
  const [anio, mes, dia] = fecha.slice(0, 10).split('-');
  return `${Number(dia)} de ${MESES[Number(mes) - 1]} de ${anio}`;
}

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
      {/* Va PRIMERO y no como una nota al pie: mientras el candado por fecha
          está puesto, el interruptor de abajo no suspende a nadie aunque
          figure "Activa". Sin esta explicación, Sistemas ve el interruptor
          encendido y a cero proveedores suspendidos, y parece una falla. */}
      {!data.ya_es_exigible && (
        <Card className="border-l-4 border-l-brand-yellow">
          <h2 className="font-display text-base font-semibold text-brand-900">
            La suspensión está en pausa hasta el {formatearFecha(data.vigente_desde)}
          </h2>
          <p className="text-sm text-brand-900/60 mt-1 max-w-2xl">
            Hasta esa fecha el portal <strong>avisa</strong> por correo de los documentos vencidos, con el mismo ciclo
            de siempre, pero <strong>no suspende ni inactiva a ningún proveedor</strong>. Es a propósito: los
            proveedores están terminando de cargar su documentación y bloquearlos ahora los dejaría afuera por algo
            que todavía están resolviendo.
          </p>
          <p className="text-xs text-brand-900/45 mt-2">
            El {formatearFecha(data.vigente_desde)} el ciclo completo se activa solo, sin que haya que tocar nada acá.
          </p>
        </Card>
      )}

      <Card>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <h2 className="font-display text-base font-semibold text-brand-900 flex items-center gap-2">
              Suspensión automática por documentación vencida
              <Badge tone={data.activa ? 'success' : 'neutral'}>{data.activa ? 'Activa' : 'Apagada'}</Badge>
              {!data.ya_es_exigible && <Badge tone="warning">En pausa hasta {formatearFecha(data.vigente_desde)}</Badge>}
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
              texto: !data.ya_es_exigible
                ? `En pausa hasta el ${formatearFecha(data.vigente_desde)}: por ahora no se suspende a nadie, solo se avisa.`
                : data.activa
                  ? 'El proveedor de esa empresa queda Suspendido y no puede ingresar hasta que el administrador lo reactive.'
                  : 'Con el interruptor apagado, no se suspende a nadie (solo quedan los avisos).',
              tono: data.ya_es_exigible && data.activa ? 'bg-brand-wine' : 'bg-brand-900/20',
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
