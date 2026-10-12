import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { obtenerEstadoEnvio, type ResultadoEnvio } from '../api/usuariosApi';
import Button from '../../../shared/components/Button';
import LogoProcesando from '../../../shared/components/LogoProcesando';

function IconoExito() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function IconoFallo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

/** Cada cuánto se pregunta cómo va el envío, y hasta cuándo. */
const INTERVALO_CONSULTA = 1000;
const ESPERA_MAXIMA = 45_000;

/**
 * Qué pasó con el código de activación, en castellano.
 *
 * APARECE AL INSTANTE (12-oct-2026). La acción -desbloquear, reenviar,
 * crear la cuenta- ya no espera al servidor de correo: el modal se abre
 * enseguida con "enviando" y va preguntando cómo terminó, hasta mostrar
 * "enviado" o "no se envió, por esto". Se puede cerrar en cualquier
 * momento: la acción ya está hecha y el correo sigue saliendo igual.
 *
 * El texto lo redacta el BACKEND (ver ResultadoEnvioCodigo): es el único
 * que sabe qué contestó el servidor de correo.
 *
 * EL DETALLE TÉCNICO VA ESCONDIDO detrás de un "Ver detalle técnico". A
 * quien está dando de alta un proveedor no le sirve leer "SMTP 550
 * 5.1.1"; a Sistemas, cuando le reenvían la captura, sí.
 */
export default function ModalResultadoEnvio({
  resultado: inicial,
  onCerrar,
  onReintentar,
  reintentando = false,
  accionRealizada,
}: {
  resultado: ResultadoEnvio;
  onCerrar: () => void;
  /** Si se pasa, el modal ofrece reintentar cuando el envío falló. */
  onReintentar?: () => void;
  reintentando?: boolean;
  /**
   * Lo que ya quedó hecho, independientemente del correo: "La cuenta
   * quedó desbloqueada". Se muestra arriba para que quede claro que eso
   * no depende de que el correo salga.
   */
  accionRealizada?: string;
}) {
  const [verDetalle, setVerDetalle] = useState(false);
  const [demorado, setDemorado] = useState(false);

  const seguirConsultando = inicial.estado === 'enviando' && inicial.id_codigo !== null;

  // Pasada la espera máxima se deja de preguntar: un servidor de correo
  // colgado no puede dejar a la pantalla consultando para siempre.
  useEffect(() => {
    if (!seguirConsultando) return;

    const temporizador = window.setTimeout(() => setDemorado(true), ESPERA_MAXIMA);
    return () => window.clearTimeout(temporizador);
  }, [seguirConsultando]);

  const { data: consultado } = useQuery({
    queryKey: ['estado-envio-codigo', inicial.id_codigo],
    queryFn: () => obtenerEstadoEnvio(inicial.id_codigo as number),
    enabled: seguirConsultando,
    // Se deja de preguntar en cuanto hay una respuesta final.
    refetchInterval: (consulta) =>
      demorado || (consulta.state.data !== undefined && consulta.state.data.estado !== 'enviando')
        ? false
        : INTERVALO_CONSULTA,
    retry: false,
  });

  const resultado = consultado ?? inicial;
  const enviando = resultado.estado === 'enviando';
  const exito = resultado.estado === 'enviado';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl">
        {accionRealizada && (
          <div className="flex items-center gap-2 border-b border-emerald-100 bg-emerald-50 px-6 py-2.5 text-sm font-medium text-emerald-800">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {accionRealizada}
          </div>
        )}

        <div className="px-6 pb-5 pt-6">
          {enviando ? (
            <div className="flex items-center gap-4">
              <LogoProcesando tamano="chico" />
              <div className="min-w-0">
                <h2 className="font-display text-base font-semibold text-brand-900">
                  {demorado ? 'El envío está tardando más de lo normal' : 'Enviando el código de activación'}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-brand-900/70 [overflow-wrap:anywhere]">
                  {demorado
                    ? 'El servidor de correo todavía no contestó. Podés cerrar esta ventana: el envío sigue en curso.'
                    : `Para ${resultado.correo}. Podés cerrar esta ventana, el correo sale igual.`}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <span className={exito ? 'mt-0.5 shrink-0 text-emerald-600' : 'mt-0.5 shrink-0 text-brand-wine'}>
                {exito ? <IconoExito /> : <IconoFallo />}
              </span>

              <div className="min-w-0">
                <h2 className="font-display text-base font-semibold text-brand-900">{resultado.titulo}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-brand-900/75 [overflow-wrap:anywhere]">
                  {resultado.mensaje}
                </p>
                {resultado.sugerencia && (
                  <p className="mt-2 text-sm leading-relaxed text-brand-900/55">{resultado.sugerencia}</p>
                )}
              </div>
            </div>
          )}

          {!enviando && resultado.detalle_tecnico && (
            <div className="mt-4 pl-9">
              <button
                onClick={() => setVerDetalle((v) => !v)}
                className="text-xs text-brand-900/45 underline hover:text-brand-900/70"
              >
                {verDetalle ? 'Ocultar detalle técnico' : 'Ver detalle técnico'}
              </button>

              {verDetalle && (
                <p className="mt-1.5 break-words rounded-md bg-brand-900/[0.04] px-3 py-2 font-mono text-xs text-brand-900/60">
                  {resultado.detalle_tecnico}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-brand-900/8 bg-brand-900/[0.02] px-6 py-3">
          {resultado.estado === 'fallido' && onReintentar && (
            <Button variant="secondary" onClick={onReintentar} isLoading={reintentando}>
              Volver a enviar
            </Button>
          )}
          <Button onClick={onCerrar} variant={enviando ? 'ghost' : 'primary'}>
            {enviando ? 'Cerrar' : 'Entendido'}
          </Button>
        </div>
      </div>
    </div>
  );
}
