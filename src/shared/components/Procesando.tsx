import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import LogoProcesando from './LogoProcesando';

/**
 * Pantalla "el sistema está trabajando", con el logo de Hanaska.
 *
 * PARA QUÉ: hay acciones que tardan unos segundos -una carga de Excel con
 * cientos de proveedores, un reenvío masivo, crear una cuenta-. Sin una
 * señal clara, la persona cree que se colgó y recarga la página o cierra
 * la sesión, justo a mitad del proceso. Esta pantalla dice "estoy
 * trabajando", qué está haciendo, y que no se cierre nada.
 *
 * Tres detalles para que no moleste en las acciones rápidas:
 *
 *  1. ESPERA ANTES DE APARECER (250 ms). Si la acción termina antes, la
 *     pantalla ni se muestra: un destello de medio segundo para algo que
 *     ya terminó molesta más de lo que informa.
 *  2. UNA VEZ QUE APARECE, SE QUEDA UN MÍNIMO (600 ms). Si no, una acción
 *     de 300 ms la haría aparecer y desaparecer en un parpadeo.
 *  3. MIENTRAS ESTÁ, PIDE CONFIRMACIÓN PARA SALIR. Si la persona intenta
 *     recargar o cerrar la pestaña, el navegador le pregunta antes.
 */

const RETRASO_ANTES_DE_MOSTRAR = 250;
const TIEMPO_MINIMO_VISIBLE = 600;

interface Proceso {
  mensaje: string;
  detalle?: string;
}

interface ContextoProcesando {
  /**
   * Ejecuta `tarea` mostrando la pantalla de carga con `mensaje`.
   * Devuelve lo mismo que la tarea, y si la tarea falla, el error sigue
   * subiendo como siempre: esto no cambia el manejo de errores de nadie.
   */
  ejecutar: <T>(mensaje: string, tarea: () => Promise<T>, detalle?: string) => Promise<T>;
}

const Contexto = createContext<ContextoProcesando | null>(null);

const esperar = (ms: number) => new Promise<void>((resolver) => window.setTimeout(resolver, ms));

export function ProcesandoProvider({ children }: { children: ReactNode }) {
  const [proceso, setProceso] = useState<Proceso | null>(null);
  const [visible, setVisible] = useState(false);
  const pendientes = useRef(0);
  const visibleDesde = useRef<number | null>(null);

  const ejecutar = useCallback(async <T,>(mensaje: string, tarea: () => Promise<T>, detalle?: string) => {
    pendientes.current += 1;
    setProceso({ mensaje, detalle });

    const temporizador = window.setTimeout(() => {
      visibleDesde.current = Date.now();
      setVisible(true);
    }, RETRASO_ANTES_DE_MOSTRAR);

    try {
      return await tarea();
    } finally {
      window.clearTimeout(temporizador);

      // Si llegó a verse, que no desaparezca en un parpadeo. Se espera
      // ANTES de devolver el control: así, lo que la pantalla que llamó
      // abra después (un modal de resultado) no queda escondido abajo.
      if (visibleDesde.current !== null) {
        const transcurrido = Date.now() - visibleDesde.current;
        if (transcurrido < TIEMPO_MINIMO_VISIBLE) {
          await esperar(TIEMPO_MINIMO_VISIBLE - transcurrido);
        }
      }

      pendientes.current -= 1;

      if (pendientes.current === 0) {
        visibleDesde.current = null;
        setVisible(false);
        setProceso(null);
      }
    }
  }, []);

  // Mientras hay algo en curso, recargar o cerrar la pestaña pide
  // confirmación. Los navegadores ya no dejan poner un texto propio en
  // ese aviso: muestran el suyo, que alcanza.
  const ocupado = proceso !== null;

  useEffect(() => {
    if (!ocupado) return;

    function alSalir(evento: BeforeUnloadEvent) {
      evento.preventDefault();
      evento.returnValue = '';
    }

    window.addEventListener('beforeunload', alSalir);
    return () => window.removeEventListener('beforeunload', alSalir);
  }, [ocupado]);

  const valor = useMemo(() => ({ ejecutar }), [ejecutar]);

  return (
    <Contexto.Provider value={valor}>
      {children}

      {visible && proceso && (
        <div
          className="procesando-fondo fixed inset-0 z-[100] flex items-center justify-center bg-brand-900/70 p-6 backdrop-blur-md"
          role="alertdialog"
          aria-modal="true"
          aria-live="assertive"
          aria-label={proceso.mensaje}
        >
          <div className="procesando-tarjeta flex max-w-sm flex-col items-center text-center">
            <LogoProcesando />

            <p className="mt-7 font-display text-lg font-semibold text-white">
              {proceso.mensaje}
              <span className="ml-0.5 inline-flex gap-0.5 align-baseline" aria-hidden="true">
                <span className="procesando-punto">.</span>
                <span className="procesando-punto">.</span>
                <span className="procesando-punto">.</span>
              </span>
            </p>

            {proceso.detalle && <p className="mt-1.5 text-sm text-white/70">{proceso.detalle}</p>}

            <p className="mt-5 rounded-full bg-white/10 px-4 py-1.5 text-xs text-white/70">
              No cierres ni recargues la página
            </p>
          </div>
        </div>
      )}
    </Contexto.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- el hook va junto a su proveedor a propósito.
export function useProcesando(): ContextoProcesando {
  const contexto = useContext(Contexto);

  if (!contexto) {
    throw new Error('useProcesando tiene que usarse dentro de <ProcesandoProvider>.');
  }

  return contexto;
}
