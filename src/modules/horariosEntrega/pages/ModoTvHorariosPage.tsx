import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/hooks/useAuth';
import * as horariosEntregaApi from '../api/horariosEntregaApi';
import { CLASIFICACIONES, ESTADOS_HORARIO, type EstadoHorario, type HorarioHoy } from '../types';
import PantallaCarga from '../../../shared/components/PantallaCarga';

/**
 * Filas que entran cómodas en una pantalla de TV con letra grande, sin
 * necesidad de medir el DOM. Si hay más que esto, se pagina en vez de
 * apretar todo -> pedido explícito del usuario: "que se ve si no alcanza
 * en la pantalla".
 */
const FILAS_POR_PAGINA = 8;

/** Cada cuánto avanza: una página más de la clasificación actual, o si ya
 *  no quedan páginas, la siguiente clasificación (con página en 0). Un
 *  solo temporizador maneja las 2 rotaciones para que no se pisen. */
const SEGUNDOS_POR_PASO = 10;

/** El backend ya calcula Atrasado/En_Recepcion según la hora actual ->
 *  con refrescar cada 20s alcanza para que se vean "avanzar" solos. */
const MS_REFRESCO_DATOS = 20_000;

const ESTILOS_FILA: Record<EstadoHorario, string> = {
  Programado: 'border-white/10',
  Atrasado: 'bg-brand-wine/15 border-brand-wine/50',
  En_Arribo: 'bg-sky-400/10 border-sky-400/50',
  En_Recepcion: 'bg-amber-400/10 border-amber-400/50',
  Entregado: 'border-white/5 opacity-40',
};

const ESTILOS_CHIP: Record<EstadoHorario, string> = {
  Programado: 'bg-white/10 text-white/60',
  Atrasado: 'bg-red-400 text-brand-900',
  En_Arribo: 'bg-sky-400 text-brand-900',
  En_Recepcion: 'bg-amber-400 text-brand-900',
  Entregado: 'bg-emerald-400 text-brand-900',
};

/** Reloj en vivo, para poder comparar a ojo la hora actual contra la
 *  llegada/salida programada de cada proveedor. */
function useRelojEnVivo() {
  const [ahora, setAhora] = useState(() => new Date());

  useEffect(() => {
    const intervalo = setInterval(() => setAhora(new Date()), 1000);
    return () => clearInterval(intervalo);
  }, []);

  return ahora;
}

const DIAS_SEMANA_LARGO = [
  'Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado',
];

/** "Miercoles 19/08/2026" -> pedido explícito del usuario (antes era "19
 *  de agosto de 2026"). Se escribe a mano (no toLocaleDateString) para no
 *  depender de qué locales tenga instalado el navegador/TV. */
function formatearFecha(fecha: Date): string {
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  return `${DIAS_SEMANA_LARGO[fecha.getDay()]} ${dia}/${mes}/${fecha.getFullYear()}`;
}

/** "9:00 am" a partir de una hora entera (0-23), para el rótulo de la franja. */
function formatearHoraEntera(hora: number): string {
  const hora12 = hora % 12 === 0 ? 12 : hora % 12;
  return `${hora12}:00 ${hora < 12 ? 'am' : 'pm'}`;
}

/** "HH:MM" -> minutos desde medianoche. */
function aMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

/** Minuto de salida programado: usa Hora_Salida si vino; si no, la deriva
 *  de las duraciones (preparación + permanencia), y si tampoco hay
 *  duración, asume 30 min por defecto -> nunca deja un horario sin fin. */
function minutoDeSalida(h: HorarioHoy): number {
  if (h.hora_salida) return aMinutos(h.hora_salida);

  const duracion = (h.tiempo_preparacion_min ?? 0) + (h.tiempo_permanencia_min ?? 0);
  return aMinutos(h.hora_llegada) + (duracion > 0 ? duracion : 30);
}

/**
 * ¿Este horario está "vigente" en la franja [inicioMin, finMin)? Pedido
 * explícito del usuario: en vez de mostrar TODO el día, el Modo TV ahora
 * es una "franja de 1 hora" que sigue el reloj real -> un proveedor que
 * llega 9:50 y se queda 2 horas (sale 11:50) se ve en la franja 9-10,
 * 10-11 y 11-12, y desaparece en la de 12-13 apenas el reloj la cruza.
 * Es la misma lógica que un tablero de vuelos: no importa el estado
 * (arribó/en recepción/etc), lo que importa es si su ventana programada
 * se solapa con la hora actual.
 */
function estaEnFranja(h: HorarioHoy, inicioMin: number, finMin: number): boolean {
  const llegadaMin = aMinutos(h.hora_llegada);
  const salidaMin = minutoDeSalida(h);

  return llegadaMin < finMin && salidaMin > inicioMin;
}

/**
 * Pide pantalla completa y mantiene un estado con si está activa o no.
 * El primer intento (al entrar por el botón de Pedidos) SÍ funciona
 * porque viaja dentro del mismo gesto del clic (ver BotonModoTv en
 * PedidosPage); si alguien entra por URL directa o la cierra a mano
 * (Alt+Tab, F11), el navegador bloquea el intento automático sin avisar
 * -> por eso queda también el botón manual "Pantalla completa".
 */
function useFullscreen() {
  const [activa, setActiva] = useState(() => !!document.fullscreenElement);

  useEffect(() => {
    function alCambiar() {
      setActiva(!!document.fullscreenElement);
    }
    document.addEventListener('fullscreenchange', alCambiar);
    return () => document.removeEventListener('fullscreenchange', alCambiar);
  }, []);

  async function solicitar() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Bloqueado por el navegador (sin gesto del usuario) -> se queda
      // el botón manual, no hay nada más que hacer acá.
    }
  }

  return { activa, solicitar };
}

/**
 * Trae las 3 clasificaciones EN PARALELO (una query por cada una, no una
 * sola que cambia de clasificación) -> antes se pedía solo la
 * clasificación que se estaba mostrando, y al rotar a la siguiente el
 * temporizador de páginas no tenía forma de saber cuántas páginas tenía
 * esa clasificación nueva hasta que su fetch terminara. Si el temporizador
 * de rotación (cada 10s) disparaba antes de que ese fetch resolviera, el
 * total de páginas se leía como 1 (dato vacío todavía) y se saltaba
 * directo a la SIGUIENTE clasificación -> eso era el "a veces se salta de
 * Perecibles a Fruver sin pasar por No Perecibles". Con las 3 ya cargadas
 * de entrada, la cantidad de páginas de cada una siempre está lista antes
 * de que haga falta.
 */
function useHorariosDeHoyPorClasificacion(habilitado: boolean) {
  const consultas = CLASIFICACIONES.map((c) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks -- CLASIFICACIONES es un array fijo de 3, nunca cambia de tamaño.
    useQuery({
      queryKey: ['horarios-entrega-hoy', c.valor],
      queryFn: () => horariosEntregaApi.listarHoy(c.valor),
      enabled: habilitado,
      refetchInterval: MS_REFRESCO_DATOS,
    })
  );

  return consultas.map((q) => q.data ?? []) as HorarioHoy[][];
}

/**
 * Vista de pantalla completa del calendario, fuera de ProtectedRoute (sin
 * header/menú del dashboard) -> pedido explícito del usuario: un botón en
 * Pedidos que "redirige a la pantalla completa". Verifica sesión y rol a
 * mano, porque al vivir fuera de ProtectedRoute no hereda esa protección.
 *
 * Tabla larga ordenada por hora de llegada (el próximo primero, como un
 * tablero de aeropuerto) -> pedido explícito, en vez de la agrupación por
 * andén que tenía antes. Los "Entregado" nunca aparecen (el backend ya
 * los filtra en /horarios-entrega/hoy).
 *
 * Además, solo se muestra lo que esté VIGENTE en la hora en curso (ver
 * estaEnFranja): un proveedor que llega 9:50 y sale 11:50 se ve en las
 * franjas 9-10, 10-11 y 11-12, y desaparece solo en la de 12-13, sin que
 * nadie lo saque a mano -> pedido explícito del usuario, mismo criterio
 * que un tablero de vuelos.
 */
export default function ModoTvHorariosPage() {
  const { isAuthenticated, isLoading, esSistemas, esAdmin, esCompras, esCalidad, esGuardia } = useAuth();
  const navigate = useNavigate();
  const [indiceClasificacion, setIndiceClasificacion] = useState(0);
  const [paginaActual, setPaginaActual] = useState(0);
  const ahora = useRelojEnVivo();
  const { activa: pantallaCompletaActiva, solicitar: solicitarPantallaCompleta } = useFullscreen();

  const filasPorClasificacionDelDia = useHorariosDeHoyPorClasificacion(isAuthenticated);

  // Franja de la hora actual: [9:00, 10:00), [10:00, 11:00), etc. Se
  // recalcula solo cuando cambia la hora (no en cada segundo del reloj),
  // así la pantalla no se reordena de más.
  const inicioFranjaMin = ahora.getHours() * 60;
  const finFranjaMin = inicioFranjaMin + 60;

  const filasPorClasificacion = filasPorClasificacionDelDia.map((filas) =>
    filas.filter((h) => estaEnFranja(h, inicioFranjaMin, finFranjaMin))
  );
  const totalPaginasPorClasificacion = filasPorClasificacion.map((filas) => Math.max(1, Math.ceil(filas.length / FILAS_POR_PAGINA)));

  const clasificacionActual = CLASIFICACIONES[indiceClasificacion % CLASIFICACIONES.length];
  const filas = filasPorClasificacion[indiceClasificacion] ?? [];
  const totalPaginas = totalPaginasPorClasificacion[indiceClasificacion] ?? 1;

  // Se intenta apenas se monta (funciona si se llegó por el botón de
  // Pedidos, que ya lo pidió dentro del mismo clic) y se reintenta solo
  // si el usuario toca el botón manual.
  useEffect(() => {
    solicitarPantallaCompleta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si la página en la que estábamos ya no existe (p.ej. se marcaron
  // "entregado" varios proveedores y ahora hay menos páginas), la acomoda
  // en vez de dejarla mostrando una página vacía.
  useEffect(() => {
    setPaginaActual((p) => (p >= totalPaginas ? 0 : p));
  }, [totalPaginas]);

  // Un solo temporizador para las 2 rotaciones (página y clasificación).
  // Lee SIEMPRE los totales de página más recientes de las 3
  // clasificaciones por ref (no solo la actual) -> como ya vienen
  // cargadas en paralelo, nunca hace falta "esperar" a que la siguiente
  // termine de cargar para saber cuántas páginas tiene.
  const totalesRef = useRef(totalPaginasPorClasificacion);
  totalesRef.current = totalPaginasPorClasificacion;

  // El intervalo no puede depender de `indiceClasificacion` en su array de
  // dependencias (si no, se reiniciaría el conteo de 10s cada vez que
  // rota) -> se lee por ref, mismo criterio que totalesRef.
  const indiceClasificacionRef = useRef(indiceClasificacion);
  indiceClasificacionRef.current = indiceClasificacion;

  // También la página actual se lee por ref, y NO desde el parámetro `p`
  // del updater de setPaginaActual. Motivo: en <StrictMode> (activo en
  // main.tsx) React puede invocar DOS VECES la función updater que se le
  // pasa a un setState, para detectar updaters impuros. Antes, ese updater
  // tenía adentro un efecto secundario (un setIndiceClasificacion anidado)
  // en la rama de "ya no quedan páginas" -> si React lo invocaba 2 veces en
  // ese tick, el índice de clasificación avanzaba +2 en vez de +1, que es
  // justo el "se salta una categoría" reportado. Ahora el callback del
  // intervalo calcula todo a partir de refs (sin depender de lo que le
  // llegue como argumento) y llama a setPaginaActual/setIndiceClasificacion
  // como 2 llamadas independientes en el cuerpo del callback, ninguna
  // anidada dentro del updater de la otra -> ningún updater tiene efectos
  // secundarios que StrictMode pueda duplicar.
  const paginaActualRef = useRef(paginaActual);
  paginaActualRef.current = paginaActual;

  useEffect(() => {
    const intervalo = setInterval(() => {
      const totalActual = totalesRef.current[indiceClasificacionRef.current] ?? 1;

      if (paginaActualRef.current + 1 < totalActual) {
        setPaginaActual(paginaActualRef.current + 1);
      } else {
        setIndiceClasificacion((indiceClasificacionRef.current + 1) % CLASIFICACIONES.length);
        setPaginaActual(0);
      }
    }, SEGUNDOS_POR_PASO * 1000);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    function alPresionarEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') navigate('/pedidos');
    }
    window.addEventListener('keydown', alPresionarEsc);
    return () => window.removeEventListener('keydown', alPresionarEsc);
  }, [navigate]);

  // Al salir de esta pantalla (ESC, navegación, etc.) se cierra la
  // pantalla completa -> si no, el usuario se queda "atrapado" viendo
  // Pedidos en fullscreen sin saber cómo salir.
  useEffect(() => {
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  if (isLoading) {
    return <PantallaCarga />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const tieneAcceso = esSistemas || esAdmin || esCompras || esCalidad || esGuardia;

  if (!tieneAcceso) {
    return (
      <div className="fixed inset-0 bg-brand-900 flex items-center justify-center text-white">
        <p className="text-lg">Tu rol actual no tiene permiso para ver el calendario en Modo TV.</p>
      </div>
    );
  }

  const enCursoAhora = filas.filter((h) => h.estado === 'En_Arribo' || h.estado === 'En_Recepcion').length;
  const filasPagina = filas.slice(paginaActual * FILAS_POR_PAGINA, (paginaActual + 1) * FILAS_POR_PAGINA);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-brand-900 to-[#0f2027] text-white overflow-hidden flex flex-col">
      {!pantallaCompletaActiva && (
        <button
          onClick={solicitarPantallaCompleta}
          className="absolute top-3 right-3 z-10 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
          </svg>
          Pantalla completa
        </button>
      )}

      <div className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <div>
          <p className="text-sm text-white/50 uppercase tracking-wide">Calendario de horarios de entrega</p>
          <div className="flex items-baseline gap-4">
            <h1 className="font-display text-3xl font-semibold">{formatearFecha(ahora)}</h1>
            <span className="text-xl text-white/60 tabular-nums">
              {ahora.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-white/50">
            Franja: <span className="text-white font-medium">{formatearHoraEntera(ahora.getHours())} – {formatearHoraEntera((ahora.getHours() + 1) % 24)}</span>
          </span>
          {enCursoAhora > 0 && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              {enCursoAhora} en curso
            </span>
          )}
          <div className="flex items-center gap-3">
            {CLASIFICACIONES.map((c, i) => (
              <span
                key={c.valor}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  i === indiceClasificacion % CLASIFICACIONES.length ? 'bg-white text-brand-900' : 'bg-white/10 text-white/50'
                }`}
              >
                {c.etiqueta}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-8 py-6">
        {filas.length === 0 ? (
          <p className="text-white/50 text-xl text-center py-24">
            No hay entregas de {clasificacionActual.etiqueta} programadas entre{' '}
            {formatearHoraEntera(ahora.getHours())} y {formatearHoraEntera((ahora.getHours() + 1) % 24)}.
          </p>
        ) : (
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr className="text-white/50 text-sm uppercase tracking-wide">
                <th className="py-2 pr-4">Llegada</th>
                <th className="py-2 pr-4">Salida</th>
                <th className="py-2 pr-4">Andén/Puerta</th>
                <th className="py-2 pr-4">Código</th>
                <th className="py-2 pr-4">Proveedor</th>
                <th className="py-2 pr-4">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filasPagina.map((h) => (
                <tr key={h.id_horario_entrega_proveedor} className={`text-2xl border-l-4 ${ESTILOS_FILA[h.estado]}`}>
                  <td className="py-3 pr-4 font-bold tabular-nums">{h.hora_llegada}</td>
                  <td className="py-3 pr-4 tabular-nums text-white/80">{h.hora_salida ?? '—'}</td>
                  <td className="py-3 pr-4 text-xl">{h.anden_puerta ?? '—'}</td>
                  <td className="py-3 pr-4 text-white/60 text-lg">{h.codigo_proveedor ?? '—'}</td>
                  <td className="py-3 pr-4">{h.nombre_proveedor}</td>
                  <td className="py-3 pr-4">
                    <span className={`text-sm font-semibold uppercase tracking-wide px-3 py-1 rounded-full ${ESTILOS_CHIP[h.estado]}`}>
                      {ESTADOS_HORARIO[h.estado].etiqueta}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="px-8 py-3 flex items-center justify-center gap-4 text-xs text-white/30 border-t border-white/10">
        <span>Presiona ESC para salir del Modo TV</span>
        {totalPaginas > 1 && (
          <span className="flex items-center gap-1.5">
            ·
            {Array.from({ length: totalPaginas }, (_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full ${i === paginaActual ? 'bg-white/70' : 'bg-white/20'}`}
              />
            ))}
            Página {paginaActual + 1} de {totalPaginas}
          </span>
        )}
      </div>
    </div>
  );
}
