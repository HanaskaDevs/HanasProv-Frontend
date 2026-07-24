import { useState } from 'react';
import Button from '../../../shared/components/Button';
import Badge from '../../../shared/components/Badge';

function IconoCheck({ className = '' }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconoX({ className = '' }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function formateaFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' });
}

interface ControlesCalificacionProps {
  // Documentos usa null para "sin calificar todavía"; Productos usa el
  // string 'Pendiente' para lo mismo -> se aceptan los dos, el chequeo
  // de "yaCalificado" de abajo ya los trata igual (ninguno cuenta como
  // "ya decidido").
  estado: 'Aprobado' | 'Rechazado' | 'Pendiente' | null;
  observacion: string | null;
  fecha: string | null;
  onCalificar: (aprobado: boolean, observacion?: string) => void;
  calificando: boolean;
  /** Compacta los botones para usarlos dentro de una fila de lista (documentos) en vez del bloque grande (ficha). */
  compacto?: boolean;
  /** true cuando ya se "Registró" la calificación completa -> ni siquiera se puede volver a calificar hasta que el proveedor corrija algo. */
  soloLectura?: boolean;
}

/**
 * Visto (✓) = Aprobado = 100. X (✗) = Rechazado = 0 + observación
 * obligatoria (retroalimentación para el proveedor). Ya calificado ->
 * muestra el resultado con opción de "Volver a calificar" por si el
 * admin se equivocó o el proveedor corrigió algo fuera de este flujo.
 */
export default function ControlesCalificacion({
  estado,
  observacion,
  fecha,
  onCalificar,
  calificando,
  compacto = false,
  soloLectura = false,
}: ControlesCalificacionProps) {
  const [modoRechazo, setModoRechazo] = useState(false);
  const [modoRecalificar, setModoRecalificar] = useState(false);
  const [textoObservacion, setTextoObservacion] = useState('');

  // Antes era "estado !== null" -> funcionaba para Documentos (donde lo
  // "sin calificar" es null), pero Productos arranca en el string
  // "Pendiente" al registrarse (no null), y "Pendiente" !== null da
  // true -> lo mostraba como si ya estuviera calificado, y como no era
  // "Aprobado" caía directo en "Rechazado" sin que nadie lo hubiera
  // tocado. Chequear explícitamente Aprobado/Rechazado es correcto para
  // los dos casos, sin importar qué valor use cada módulo para "todavía
  // no calificado".
  const yaCalificado = (estado === 'Aprobado' || estado === 'Rechazado') && !modoRecalificar;

  if (yaCalificado) {
    return (
      <div className={compacto ? 'flex items-center gap-2' : 'space-y-1.5'}>
        <div className="flex items-center gap-2 flex-wrap">
          {estado === 'Aprobado' ? (
            <Badge tone="success">Aprobado</Badge>
          ) : (
            <Badge tone="danger" className="!bg-amber-100 !text-amber-800">
              Rechazado
            </Badge>
          )}
          {fecha && <span className="text-[11px] text-brand-900/40">{formateaFecha(fecha)}</span>}
          {!soloLectura && (
            <button
              onClick={() => {
                setModoRecalificar(true);
                setModoRechazo(false);
                setTextoObservacion(observacion ?? '');
              }}
              className="text-[11px] font-medium text-brand-700 hover:underline"
            >
              Volver a calificar
            </button>
          )}
        </div>
        {estado === 'Rechazado' && observacion && !compacto && (
          <p className="text-xs text-brand-900/70 bg-brand-wine/5 border border-brand-wine/15 rounded-md px-2.5 py-1.5">
            <span className="font-semibold text-brand-wine">Motivo:</span> {observacion}
          </p>
        )}
      </div>
    );
  }

  if (soloLectura) {
    return <Badge tone="neutral">Sin calificar</Badge>;
  }

  if (modoRechazo || (modoRecalificar && estado !== 'Aprobado')) {
    return (
      <div className="space-y-1.5">
        <textarea
          value={textoObservacion}
          onChange={(e) => setTextoObservacion(e.target.value)}
          placeholder="Observación para el proveedor (obligatoria al rechazar)"
          rows={2}
          className="w-full rounded-md border border-brand-900/20 px-2 py-1.5 text-xs text-brand-900
            focus:outline-none focus:ring-2 focus:ring-brand-700"
        />
        <div className="flex gap-2">
          <Button
            variant="danger"
            className="text-xs px-2.5 py-1"
            disabled={!textoObservacion.trim()}
            isLoading={calificando}
            onClick={() => onCalificar(false, textoObservacion.trim())}
          >
            Confirmar rechazo
          </Button>
          <Button
            variant="ghost"
            className="text-xs px-2.5 py-1"
            onClick={() => {
              setModoRechazo(false);
              setModoRecalificar(false);
            }}
            disabled={calificando}
          >
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onCalificar(true)}
        disabled={calificando}
        title="Aprobar"
        className="h-7 w-7 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors disabled:opacity-50"
      >
        <IconoCheck />
      </button>
      <button
        onClick={() => setModoRechazo(true)}
        disabled={calificando}
        title="Rechazar"
        className="h-7 w-7 rounded-full flex items-center justify-center bg-brand-wine/10 text-brand-wine hover:bg-brand-wine/20 transition-colors disabled:opacity-50"
      >
        <IconoX />
      </button>
      {modoRecalificar && (
        <button
          onClick={() => setModoRecalificar(false)}
          className="text-[11px] text-brand-900/40 hover:text-brand-900"
        >
          Cancelar
        </button>
      )}
    </div>
  );
}