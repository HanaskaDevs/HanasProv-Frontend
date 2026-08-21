import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/hooks/useAuth';
import * as horariosEntregaApi from '../api/horariosEntregaApi';
import { CLASIFICACIONES, type ClasificacionHorario, type HorarioHoy } from '../types';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import Spinner from '../../../shared/components/Spinner';
import Modal from '../../../shared/components/Modal';
import RoleRoute from '../../../routes/RoleRoute';
import BadgeEstadoHorario from '../components/BadgeEstadoHorario';

/** Refresca solo: Atrasado/En_Recepcion se calculan en el backend según
 *  la hora actual, así que sin recargar la página el estado igual
 *  "avanza solo" cada vez que refresca. */
const INTERVALO_REFRESCO_MS = 20_000;

type TipoAccion = 'arribo' | 'entregado';

interface AccionPendiente {
  tipo: TipoAccion;
  horario: HorarioHoy;
}

/** Botones "Marcar arribo/entregado" que dispara la fila (tabla en
 *  escritorio) o la tarjeta (mobile/tablet) -> se comparten para no
 *  repetir el mismo bloque en los dos layouts. En mobile ocupan todo el
 *  ancho y son más altos (min-h-11 ≈ 44px) porque el Guardia normalmente
 *  toca esto desde el celular parado en el andén, no con mouse.
 */
function BotonesAccion({
  horario,
  puedeMarcarArribo,
  puedeMarcarEntregado,
  onPedirConfirmacion,
  compacto,
}: {
  horario: HorarioHoy;
  puedeMarcarArribo: boolean;
  puedeMarcarEntregado: boolean;
  onPedirConfirmacion: (accion: AccionPendiente) => void;
  /** true = fila de tabla (botones chicos, en línea); false = tarjeta
   *  mobile (botones grandes, a lo ancho). */
  compacto: boolean;
}) {
  const mostrarBotonArribo = puedeMarcarArribo && (horario.estado === 'Programado' || horario.estado === 'Atrasado');
  const mostrarBotonEntregado = puedeMarcarEntregado && (horario.estado === 'En_Arribo' || horario.estado === 'En_Recepcion');

  if (!mostrarBotonArribo && !mostrarBotonEntregado) {
    return null;
  }

  const claseBoton = compacto ? 'text-xs px-3 py-1.5' : 'text-sm px-4 min-h-11 w-full';

  return (
    <div className={compacto ? 'flex justify-end' : 'flex flex-col gap-2'}>
      {mostrarBotonArribo && (
        <Button className={claseBoton} onClick={() => onPedirConfirmacion({ tipo: 'arribo', horario })}>
          Marcar arribo
        </Button>
      )}
      {mostrarBotonEntregado && (
        <Button
          variant="secondary"
          className={claseBoton}
          onClick={() => onPedirConfirmacion({ tipo: 'entregado', horario })}
        >
          Marcar entregado
        </Button>
      )}
    </div>
  );
}

function FilaSeguimiento({
  horario,
  puedeMarcarArribo,
  puedeMarcarEntregado,
  onPedirConfirmacion,
}: {
  horario: HorarioHoy;
  puedeMarcarArribo: boolean;
  puedeMarcarEntregado: boolean;
  onPedirConfirmacion: (accion: AccionPendiente) => void;
}) {
  return (
    <tr>
      <td className="py-2.5 px-4 font-semibold tabular-nums">{horario.hora_llegada}</td>
      <td className="py-2.5 px-2">{horario.anden_puerta ?? '—'}</td>
      <td className="py-2.5 px-2 text-brand-900/60">{horario.codigo_proveedor ?? '—'}</td>
      <td className="py-2.5 px-2">{horario.nombre_proveedor}</td>
      <td className="py-2.5 px-2 text-brand-900/60">
        {CLASIFICACIONES.find((c) => c.valor === horario.clasificacion)?.etiqueta}
      </td>
      <td className="py-2.5 px-2">
        <BadgeEstadoHorario estado={horario.estado} />
      </td>
      <td className="py-2.5 px-4 text-right whitespace-nowrap">
        <BotonesAccion
          horario={horario}
          puedeMarcarArribo={puedeMarcarArribo}
          puedeMarcarEntregado={puedeMarcarEntregado}
          onPedirConfirmacion={onPedirConfirmacion}
          compacto
        />
      </td>
    </tr>
  );
}

/**
 * Tarjeta para mobile/tablet (pantalla < md) -> pedido explícito del
 * usuario: las vistas donde el Guardia/Compras cambian el estado deben
 * ser usables en celular o tablet, no solo en escritorio. En vez de meter
 * la tabla de 7 columnas en un scroll horizontal (incómodo con el dedo),
 * cada horario se muestra como una tarjeta apilada con los datos en
 * pares etiqueta/valor y los botones de acción a todo el ancho.
 */
function TarjetaSeguimiento({
  horario,
  puedeMarcarArribo,
  puedeMarcarEntregado,
  onPedirConfirmacion,
}: {
  horario: HorarioHoy;
  puedeMarcarArribo: boolean;
  puedeMarcarEntregado: boolean;
  onPedirConfirmacion: (accion: AccionPendiente) => void;
}) {
  return (
    <div className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-brand-900 leading-tight">{horario.nombre_proveedor}</p>
          {horario.codigo_proveedor && (
            <p className="text-xs text-brand-900/50">{horario.codigo_proveedor}</p>
          )}
        </div>
        <BadgeEstadoHorario estado={horario.estado} />
      </div>

      <div className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <p className="text-[11px] uppercase text-brand-900/40">Llegada</p>
          <p className="font-semibold tabular-nums">{horario.hora_llegada}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase text-brand-900/40">Andén/Puerta</p>
          <p>{horario.anden_puerta ?? '—'}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase text-brand-900/40">Clasificación</p>
          <p>{CLASIFICACIONES.find((c) => c.valor === horario.clasificacion)?.etiqueta}</p>
        </div>
      </div>

      <BotonesAccion
        horario={horario}
        puedeMarcarArribo={puedeMarcarArribo}
        puedeMarcarEntregado={puedeMarcarEntregado}
        onPedirConfirmacion={onPedirConfirmacion}
        compacto={false}
      />
    </div>
  );
}

/** Reloj en vivo -> la hora que se muestra en el diálogo es la hora REAL
 *  que va a quedar registrada al aceptar, no una foto vieja de cuando se
 *  abrió la pantalla. */
function useRelojEnVivo() {
  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => {
    const intervalo = setInterval(() => setAhora(new Date()), 1000);
    return () => clearInterval(intervalo);
  }, []);
  return ahora;
}

const TEXTOS_ACCION: Record<TipoAccion, { titulo: string; pregunta: string; boton: string }> = {
  arribo: {
    titulo: 'Confirmar arribo del proveedor',
    pregunta: '¿Confirmas que este proveedor llegó AHORA a recepción?',
    boton: 'Sí, marcar arribo',
  },
  entregado: {
    titulo: 'Confirmar entrega completada',
    pregunta: '¿Confirmas que esta entrega ya se completó?',
    boton: 'Sí, marcar entregado',
  },
};

/**
 * Diálogo con los datos del horario antes de registrar el estado -> pedido
 * explícito del usuario: si el Guardia (o Compras) se equivoca de fila, ve
 * el proveedor/hora/andén ANTES de confirmar, en vez de que quede
 * registrado apenas toca el botón.
 */
function ModalConfirmacion({
  accion,
  onCancelar,
  onConfirmar,
  cargando,
  error,
}: {
  accion: AccionPendiente;
  onCancelar: () => void;
  onConfirmar: () => void;
  cargando: boolean;
  error: string | null;
}) {
  const ahora = useRelojEnVivo();
  const { horario, tipo } = accion;
  const textos = TEXTOS_ACCION[tipo];

  return (
    <Modal onClose={onCancelar} title={textos.titulo} maxWidth="max-w-md">
      <div className="space-y-4">
        <p className="text-sm text-brand-900/70">{textos.pregunta}</p>

        <div className="rounded-md border border-brand-900/10 divide-y divide-brand-900/6 text-sm">
          <div className="flex justify-between px-3 py-2">
            <span className="text-brand-900/50">Proveedor</span>
            <span className="font-medium text-brand-900">{horario.nombre_proveedor}</span>
          </div>
          {horario.codigo_proveedor && (
            <div className="flex justify-between px-3 py-2">
              <span className="text-brand-900/50">Código BC</span>
              <span className="font-medium text-brand-900">{horario.codigo_proveedor}</span>
            </div>
          )}
          <div className="flex justify-between px-3 py-2">
            <span className="text-brand-900/50">Clasificación</span>
            <span className="font-medium text-brand-900">
              {CLASIFICACIONES.find((c) => c.valor === horario.clasificacion)?.etiqueta}
            </span>
          </div>
          <div className="flex justify-between px-3 py-2">
            <span className="text-brand-900/50">Andén/Puerta</span>
            <span className="font-medium text-brand-900">{horario.anden_puerta ?? '—'}</span>
          </div>
          <div className="flex justify-between px-3 py-2">
            <span className="text-brand-900/50">Hora programada</span>
            <span className="font-medium text-brand-900">{horario.hora_llegada}</span>
          </div>
          <div className="flex justify-between px-3 py-2 bg-brand-900/4">
            <span className="text-brand-900/50">
              {tipo === 'arribo' ? 'Hora de arribo a registrar' : 'Hora de entrega a registrar'}
            </span>
            <span className="font-semibold text-brand-900 tabular-nums">
              {ahora.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>

        {error && <p className="text-xs text-brand-wine">{error}</p>}

        {/* Columna en mobile (botones a todo el ancho, más altos para el
         *  dedo) y en línea a partir de sm -> mismo diálogo, dos layouts. */}
        <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
          <Button
            variant="ghost"
            className="text-sm px-4 min-h-11 w-full sm:w-auto order-2 sm:order-1"
            onClick={onCancelar}
            disabled={cargando}
          >
            Cancelar
          </Button>
          <Button
            className="text-sm px-4 min-h-11 w-full sm:w-auto order-1 sm:order-2"
            isLoading={cargando}
            onClick={onConfirmar}
          >
            {textos.boton}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function SeguimientoContenido() {
  const { esSistemas, esAdmin, esCompras, esGuardia } = useAuth();
  const [tab, setTab] = useState<ClasificacionHorario | 'Todas'>('Todas');
  const [accionPendiente, setAccionPendiente] = useState<AccionPendiente | null>(null);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const puedeMarcarArribo = esSistemas || esAdmin || esGuardia;
  const puedeMarcarEntregado = esSistemas || esAdmin || esCompras;

  const { data: horarios, isLoading } = useQuery({
    queryKey: ['horarios-entrega-hoy', tab],
    queryFn: () => horariosEntregaApi.listarHoy(tab === 'Todas' ? undefined : tab),
    refetchInterval: INTERVALO_REFRESCO_MS,
  });

  function cerrarModal() {
    setAccionPendiente(null);
    setErrorModal(null);
  }

  const confirmar = useMutation({
    mutationFn: (accion: AccionPendiente) =>
      accion.tipo === 'arribo'
        ? horariosEntregaApi.marcarArribo(accion.horario.id_horario_entrega_proveedor)
        : horariosEntregaApi.marcarEntregado(accion.horario.id_horario_entrega_proveedor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horarios-entrega-hoy'] });
      cerrarModal();
    },
    onError: (e: unknown) => {
      const mensaje = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErrorModal(mensaje ?? 'No se pudo registrar. Intenta de nuevo.');
    },
  });

  return (
    <div className="max-w-6xl mx-auto w-full space-y-4">
      <div>
        <h1 className="font-display text-xl font-semibold text-brand-900 flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-brand-700">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          Seguimiento de entregas de hoy
        </h1>
        <p className="text-brand-900/50 text-xs mt-0.5">
          Se actualiza solo cada {INTERVALO_REFRESCO_MS / 1000}s. Los ya entregados dejan de aparecer aquí.
        </p>
      </div>

      {/* Selector en celular/tablet angosta (pedido explícito del usuario,
       *  pensando sobre todo en el Guardia que usa esta pantalla casi
       *  siempre desde el celular): un <select> nativo ocupa una sola
       *  línea y no hay que deslizar nada para ver las 4 opciones. En
       *  escritorio (sm+) se mantienen las pestañas de siempre. */}
      <div className="sm:hidden">
        <select
          value={tab}
          onChange={(e) => setTab(e.target.value as ClasificacionHorario | 'Todas')}
          className="w-full border border-brand-900/15 rounded-md px-3 py-2.5 text-sm bg-white text-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-700/30"
        >
          <option value="Todas">Todas</option>
          {CLASIFICACIONES.map((c) => (
            <option key={c.valor} value={c.valor}>
              {c.etiqueta}
            </option>
          ))}
        </select>
      </div>

      {/* overflow-x-auto + shrink-0: en pantallas angostas las pestañas se
       *  deslizan con el dedo en vez de apretarse o partirse en 2 líneas
       *  -> ya no aplica en celular (ver el <select> de arriba), pero se
       *  deja igual por si algún día hay más de 4 clasificaciones. */}
      <div className="hidden sm:flex items-center gap-1 border-b border-brand-900/10 overflow-x-auto">
        {(['Todas', ...CLASIFICACIONES.map((c) => c.valor)] as const).map((valor) => (
          <button
            key={valor}
            onClick={() => setTab(valor)}
            className={`shrink-0 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === valor ? 'border-brand-700 text-brand-900' : 'border-transparent text-brand-900/40 hover:text-brand-900/70'
            }`}
          >
            {valor === 'Todas' ? 'Todas' : CLASIFICACIONES.find((c) => c.valor === valor)?.etiqueta}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-6 w-6" />
        </div>
      ) : (horarios ?? []).length === 0 ? (
        <Card>
          <p className="text-sm text-brand-900/60 text-center py-10">
            No hay entregas pendientes para hoy (o ya se completaron todas).
          </p>
        </Card>
      ) : (
        <>
          {/* Escritorio/tablet ancha (md+): tabla completa. Pedido
           *  explícito del usuario de hacer responsive las vistas donde
           *  se cambia el estado -> abajo de md se esconde y se muestra
           *  la versión en tarjetas en su lugar (ver más abajo). */}
          <Card className="p-0 overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-brand-900/50 border-b border-brand-900/10">
                    <th className="py-2 px-4">Llegada</th>
                    <th className="py-2 px-2">Andén/Puerta</th>
                    <th className="py-2 px-2">Código</th>
                    <th className="py-2 px-2">Proveedor</th>
                    <th className="py-2 px-2">Clasificación</th>
                    <th className="py-2 px-2">Estado</th>
                    <th className="py-2 px-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-900/6">
                  {(horarios ?? []).map((h) => (
                    <FilaSeguimiento
                      key={h.id_horario_entrega_proveedor}
                      horario={h}
                      puedeMarcarArribo={puedeMarcarArribo}
                      puedeMarcarEntregado={puedeMarcarEntregado}
                      onPedirConfirmacion={(accion) => {
                        setErrorModal(null);
                        setAccionPendiente(accion);
                      }}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile/tablet angosta (< md): tarjetas apiladas, una por
           *  horario, con botones a todo el ancho -> mismo dato, sin
           *  scroll horizontal ni botones diminutos para el dedo. */}
          <div className="md:hidden space-y-3">
            {(horarios ?? []).map((h) => (
              <Card key={h.id_horario_entrega_proveedor} className="p-0">
                <TarjetaSeguimiento
                  horario={h}
                  puedeMarcarArribo={puedeMarcarArribo}
                  puedeMarcarEntregado={puedeMarcarEntregado}
                  onPedirConfirmacion={(accion) => {
                    setErrorModal(null);
                    setAccionPendiente(accion);
                  }}
                />
              </Card>
            ))}
          </div>
        </>
      )}

      {accionPendiente && (
        <ModalConfirmacion
          accion={accionPendiente}
          onCancelar={cerrarModal}
          onConfirmar={() => confirmar.mutate(accionPendiente)}
          cargando={confirmar.isPending}
          error={errorModal}
        />
      )}
    </div>
  );
}

/**
 * Pantalla del Guardia (marca "arribó") y de Compras (marca "entregado"),
 * pedido explícito del usuario. Sistemas/Admin ven y pueden hacer ambas
 * acciones, como respaldo. Ambas acciones pasan por un diálogo de
 * confirmación con los datos del horario antes de registrar nada -> así
 * un toque accidental en la fila equivocada no queda guardado.
 */
export default function SeguimientoHoyPage() {
  const { esSistemas, esAdmin, esCompras, esGuardia } = useAuth();

  return (
    <RoleRoute allow={esSistemas || esAdmin || esCompras || esGuardia}>
      <SeguimientoContenido />
    </RoleRoute>
  );
}
