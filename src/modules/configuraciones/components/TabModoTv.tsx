import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Card from '../../../shared/components/Card';
import Spinner from '../../../shared/components/Spinner';
import Badge from '../../../shared/components/Badge';
import * as configuracionesApi from '../api/configuracionesApi';
import { MENSAJES_POR_ESTADO, anunciar, precalentarVoces } from '../../horariosEntrega/anunciosVoz';
import { ESTADOS_HORARIO, type EstadoHorario } from '../../horariosEntrega/types';

/**
 * Interruptor de los anuncios por voz del Modo TV del calendario de
 * entregas. Va acá (Configuraciones, solo Sistemas) y no como un botón en
 * la propia pantalla del TV: pedido explícito del usuario, para que el
 * Guardia o Compras no puedan apagarlo desde la TV.
 *
 * Las frases de ejemplo se leen de MENSAJES_POR_ESTADO, no se escriben a
 * mano acá: si mañana se cambia el texto de un anuncio, esta pantalla lo
 * refleja sola y nunca queda mostrando algo distinto de lo que se escucha.
 */

/** Solo los estados que anuncian, en el orden en que ocurren de verdad. */
const ESTADOS_QUE_ANUNCIAN: EstadoHorario[] = [
  'Atrasado',
  'Rechazado',
  'Arribo',
  'En_Recepcion',
  'Recibido',
];

const PROVEEDOR_DE_EJEMPLO = 'Cornucopia';

/** Solo lo usa el anuncio de recepción, que es el único que dice dónde. */
const ANDEN_DE_EJEMPLO = 'Andén B';

export default function TabModoTv() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['config-anuncios-voz'],
    queryFn: configuracionesApi.obtenerAnunciosVoz,
  });

  const cambiar = useMutation({
    mutationFn: (activa: boolean) => configuracionesApi.definirAnunciosVoz(activa),
    onSuccess: (nueva) => queryClient.setQueryData(['config-anuncios-voz'], nueva),
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
              Anuncios por voz en el Modo TV
              <Badge tone={data.activa ? 'success' : 'neutral'}>{data.activa ? 'Activos' : 'Apagados'}</Badge>
            </h2>
            <p className="text-sm text-brand-900/60 mt-1 max-w-2xl">
              Cuando están activos, la pantalla del Modo TV <strong>canta en voz alta cada cambio de estado</strong> de
              una entrega, como el tablero de un aeropuerto: apenas el Guardia marca el arribo, o SIGH confirma la
              recepción, se escucha el anuncio con el nombre del proveedor. Con el interruptor apagado la pantalla sigue
              funcionando igual, pero <strong>en silencio</strong>.
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
        <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
          <h3 className="font-display text-sm font-semibold text-brand-900">Qué se escucha en cada estado</h3>

          {/* Probarlo desde acá sirve de verdad: el clic cuenta como el gesto
              del usuario que los navegadores exigen para dejar sonar audio,
              así que si se escucha en esta pantalla, el equipo y el volumen
              están bien y lo que falte después es solo el toque inicial en
              la TV. */}
          <button
            type="button"
            onClick={() => {
              precalentarVoces();
              anunciar([
                MENSAJES_POR_ESTADO.Arribo?.(PROVEEDOR_DE_EJEMPLO, null) ?? '',
                MENSAJES_POR_ESTADO.En_Recepcion?.(PROVEEDOR_DE_EJEMPLO, ANDEN_DE_EJEMPLO) ?? '',
              ]);
            }}
            className="shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-brand-900/5 hover:bg-brand-900/10 text-brand-900/70 transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
            Escuchar ejemplo
          </button>
        </div>

        <p className="text-xs text-brand-900/50 mb-3">
          Ejemplo con un proveedor llamado «{PROVEEDOR_DE_EJEMPLO}». Todos los anuncios arrancan con la campanita
          «din-don», igual que en un aeropuerto.
        </p>

        <div className="space-y-2.5">
          {ESTADOS_QUE_ANUNCIAN.map((estado) => {
            const armarMensaje = MENSAJES_POR_ESTADO[estado];
            if (!armarMensaje) return null;

            const frase = armarMensaje(PROVEEDOR_DE_EJEMPLO, ANDEN_DE_EJEMPLO);

            return (
              <div key={estado} className="flex items-start gap-3">
                <span className="mt-1.5 h-2 w-2 rounded-full shrink-0 bg-brand-700" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-brand-900">{ESTADOS_HORARIO[estado].etiqueta}</p>
                  <p className="text-xs text-brand-900/55 italic">«{frase}»</p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-brand-900/40 mt-4">
          El estado «Programado» no se anuncia: es el estado inicial de todas las entregas del día, no un cambio. Los
          anuncios cubren todas las entregas de hoy, incluso las que ya no se ven en pantalla porque su franja horaria
          pasó.
        </p>
      </Card>

      <Card>
        <h3 className="font-display text-sm font-semibold text-brand-900 mb-2">Antes de dejar la TV encendida</h3>
        <p className="text-sm text-brand-900/60">
          Los navegadores no dejan reproducir sonido hasta que alguien interactúa con la página. La primera vez que se
          abra el Modo TV en esa pantalla hay que <strong>hacer un clic o tocar la pantalla una vez</strong>; si no, el
          propio Modo TV muestra el aviso «Toca la pantalla para activar los anuncios por voz». Después de ese primer
          toque los anuncios siguen sonando solos mientras la pantalla quede abierta.
        </p>
      </Card>
    </div>
  );
}
