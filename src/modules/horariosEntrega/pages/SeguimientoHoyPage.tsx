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

/** Refresca solo: Atrasado/Rechazado/En_Recepcion/Recibido se calculan o
 *  llegan solos (SIGH), así que sin recargar la página el estado igual
 *  "avanza solo" cada vez que refresca. */
const INTERVALO_REFRESCO_MS = 20_000;

type TipoAccion = 'arribo' | 'solicitar-aprobacion';

interface AccionPendiente {
  tipo: TipoAccion;
  horario: HorarioHoy;
}

/** Botones "Marcar arribo" / "Solicitar aprobación" -> Guardia y Sistemas
 *  (pedido explícito del usuario, 27-ago-2026: "seguimiento de hoy solo
 *  Sistemas y el guardia"). Ya NO existe "Marcar entregado": En_Recepcion
 *  y Recibido llegan automáticos desde SIGH.
 */
function BotonesAccion({
  horario,
  onPedirConfirmacion,
  compacto,
}: {
  horario: HorarioHoy;
  onPedirConfirmacion: (accion: AccionPendiente) => void;
  compacto: boolean;
}) {
  const mostrarBotonArribo = horario.estado === 'Programado' || horario.estado === 'Atrasado';
  const mostrarBotonSolicitar = horario.estado === 'Rechazado' && !horario.tiene_solicitud_pendiente;
  const mostrarAvisoPendiente = horario.estado === 'Rechazado' && horario.tiene_solicitud_pendiente;

  if (!mostrarBotonArribo && !mostrarBotonSolicitar && !mostrarAvisoPendiente) {
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
      {mostrarBotonSolicitar && (
        <Button
          variant="secondary"
          className={claseBoton}
          onClick={() => onPedirConfirmacion({ tipo: 'solicitar-aprobacion', horario })}
        >
          Solicitar aprobación
        </Button>
      )}
      {mostrarAvisoPendiente && (
        <span className="text-[11px] text-brand-900/50 italic">Esperando aprobación de Calidad…</span>
      )}
    </div>
  );
}

function FilaSeguimiento({
  horario,
  onPedirConfirmacion,
}: {
  horario: HorarioHoy;
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
      <td className="py-2.5 px-2 text-brand-900/60 font-mono text-xs">{horario.nro_documento_bc ?? '—'}</td>
      <td className="py-2.5 px-4 text-right whitespace-nowrap">
        <BotonesAccion horario={horario} onPedirConfirmacion={onPedirConfirmacion} compacto />
      </td>
    </tr>
  );
}

function TarjetaSeguimiento({
  horario,
  onPedirConfirmacion,
}: {
  horario: HorarioHoy;
  onPedirConfirmacion: (accion: AccionPendiente) => void;
}) {
  return (
    <div className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-brand-900 leading-tight">{horario.nombre_proveedor}</p>
          {horario.codigo_proveedor && <p className="text-xs text-brand-900/50">{horario.codigo_proveedor}</p>}
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

      {horario.nro_documento_bc && (
        <p className="text-xs text-brand-900/50">
          Documento BC: <span className="font-mono">{horario.nro_documento_bc}</span>
        </p>
      )}

      <BotonesAccion horario={horario} onPedirConfirmacion={onPedirConfirmacion} compacto={false} />
    </div>
  );
}

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
  'solicitar-aprobacion': {
    titulo: 'Solicitar aprobación de arribo tardío',
    pregunta:
      'Este horario ya pasó a Rechazado. Se enviará una solicitud a Calidad por correo; el proveedor solo pasará a Arribo si la aprueban.',
    boton: 'Sí, enviar solicitud',
  },
};

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
              {tipo === 'arribo' ? 'Hora de arribo a registrar' : 'Hora de la solicitud'}
            </span>
            <span className="font-semibold text-brand-900 tabular-nums">
              {ahora.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>

        {error && <p className="text-xs text-brand-wine">{error}</p>}

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
  const [tab, setTab] = useState<ClasificacionHorario | 'Todas'>('Todas');
  const [accionPendiente, setAccionPendiente] = useState<AccionPendiente | null>(null);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: horarios, isLoading } = useQuery({
    queryKey: ['horarios-entrega-hoy', tab],
    queryFn: () => horariosEntregaApi.listarHoy(tab === 'Todas' ? undefined : tab),
    refetchInterval: INTERVALO_REFRESCO_MS,
  });

  function cerrarModal() {
    setAccionPendiente(null);
    setErrorModal(null);
  }

  const confirmar = useMutation<unknown, unknown, AccionPendiente>({
    mutationFn: (accion: AccionPendiente) =>
      accion.tipo === 'arribo'
        ? horariosEntregaApi.marcarArribo(accion.horario.id_horario_entrega_proveedor)
        : horariosEntregaApi.solicitarAprobacion(accion.horario.id_horario_entrega_proveedor),
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
          Se actualiza solo cada {INTERVALO_REFRESCO_MS / 1000}s. Los ya recibidos dejan de aparecer aquí.
        </p>
      </div>

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
                    <th className="py-2 px-2">Documento BC</th>
                    <th className="py-2 px-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-900/6">
                  {(horarios ?? []).map((h) => (
                    <FilaSeguimiento
                      key={h.id_horario_entrega_proveedor}
                      horario={h}
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

          <div className="md:hidden space-y-3">
            {(horarios ?? []).map((h) => (
              <Card key={h.id_horario_entrega_proveedor} className="p-0">
                <TarjetaSeguimiento
                  horario={h}
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
 * Pantalla del Guardia y Sistemas ÚNICAMENTE (pedido explícito del
 * usuario, 27-ago-2026: "seguimiento de hoy solo Sistemas y el guardia").
 * Admin, Compras y Calidad ya NO entran acá -> Calidad sigue resolviendo
 * solicitudes de arribo tardío desde /calendario/aprobaciones, que es una
 * pantalla aparte y no se ve afectada por este cambio.
 */
export default function SeguimientoHoyPage() {
  const { esSistemas, esGuardia } = useAuth();

  return (
    <RoleRoute allow={esSistemas || esGuardia}>
      <SeguimientoContenido />
    </RoleRoute>
  );
}
