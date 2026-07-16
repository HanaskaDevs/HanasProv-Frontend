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
  estado: 'Aprobado' | 'Rechazado' | null;
  observacion: string | null;
  fecha: string | null;
  onCalificar: (aprobado: boolean, observacion?: string) => void;
  calificando: boolean;
  /** Compacta los botones para usarlos dentro de una fila de lista (documentos) en vez del bloque grande (ficha). */
  compacto?: boolean;
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
}: ControlesCalificacionProps) {
  const [modoRechazo, setModoRechazo] = useState(false);
  const [modoRecalificar, setModoRecalificar] = useState(false);
  const [textoObservacion, setTextoObservacion] = useState('');

  const yaCalificado = estado !== null && !modoRecalificar;

  if (yaCalificado) {
    return (
      <div className={compacto ? 'flex items-center gap-2' : 'space-y-1.5'}>
        <div className="flex items-center gap-2">
          {estado === 'Aprobado' ? (
            <Badge tone="success">✓ Aprobado (100)</Badge>
          ) : (
            <Badge tone="danger">✗ Rechazado (0)</Badge>
          )}
          {fecha && <span className="text-[11px] text-brand-900/40">{formateaFecha(fecha)}</span>}
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
        </div>
        {estado === 'Rechazado' && observacion && !compacto && (
          <p className="text-xs text-brand-900/60 bg-brand-wine/5 border border-brand-wine/10 rounded px-2 py-1">
            {observacion}
          </p>
        )}
      </div>
    );
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
        title="Aprobar (100)"
        className="h-7 w-7 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors disabled:opacity-50"
      >
        <IconoCheck />
      </button>
      <button
        onClick={() => setModoRechazo(true)}
        disabled={calificando}
        title="Rechazar (0)"
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