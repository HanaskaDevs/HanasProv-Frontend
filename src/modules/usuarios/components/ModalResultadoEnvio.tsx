import { useState } from 'react';
import type { ResultadoEnvio } from '../api/usuariosApi';
import Button from '../../../shared/components/Button';

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

/**
 * Qué pasó con el código de activación, en castellano.
 *
 * El texto lo redacta el BACKEND (ver ResultadoEnvioCodigo): es el único
 * que sabe qué contestó el servidor de correo, y tener las frases en un
 * solo lado evita que el portal diga una cosa y el log otra.
 *
 * EL DETALLE TÉCNICO VA ESCONDIDO detrás de un "Ver detalle técnico". A
 * quien está dando de alta un proveedor no le sirve leer "SMTP 550
 * 5.1.1"; a Sistemas, cuando le reenvían la captura, sí. Esconderlo del
 * todo obligaría a ir a buscar el log.
 */
export default function ModalResultadoEnvio({
  resultado,
  onCerrar,
  onReintentar,
  reintentando = false,
}: {
  resultado: ResultadoEnvio;
  onCerrar: () => void;
  /** Si se pasa, el modal ofrece reintentar cuando el envío falló. */
  onReintentar?: () => void;
  reintentando?: boolean;
}) {
  const [verDetalle, setVerDetalle] = useState(false);
  const exito = resultado.enviado;

  return (
    <div className="fixed inset-0 bg-brand-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 pt-6 pb-5">
          <div className="flex items-start gap-3">
            <span className={exito ? 'text-emerald-600 shrink-0 mt-0.5' : 'text-brand-wine shrink-0 mt-0.5'}>
              {exito ? <IconoExito /> : <IconoFallo />}
            </span>

            <div className="min-w-0">
              <h2 className="font-display text-base font-semibold text-brand-900">
                {resultado.titulo}
              </h2>
              <p className="text-sm text-brand-900/75 mt-1.5 leading-relaxed">{resultado.mensaje}</p>

              {resultado.sugerencia && (
                <p className="text-sm text-brand-900/55 mt-2 leading-relaxed">{resultado.sugerencia}</p>
              )}
            </div>
          </div>

          {resultado.detalle_tecnico && (
            <div className="mt-4 pl-9">
              <button
                onClick={() => setVerDetalle((v) => !v)}
                className="text-xs text-brand-900/45 hover:text-brand-900/70 underline"
              >
                {verDetalle ? 'Ocultar detalle técnico' : 'Ver detalle técnico'}
              </button>

              {verDetalle && (
                <p className="mt-1.5 rounded-md bg-brand-900/[0.04] px-3 py-2 text-xs font-mono text-brand-900/60 break-words">
                  {resultado.detalle_tecnico}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-3 bg-brand-900/[0.02] border-t border-brand-900/8">
          {!exito && onReintentar && (
            <Button variant="secondary" onClick={onReintentar} isLoading={reintentando}>
              Volver a enviar
            </Button>
          )}
          <Button onClick={onCerrar}>Entendido</Button>
        </div>
      </div>
    </div>
  );
}
