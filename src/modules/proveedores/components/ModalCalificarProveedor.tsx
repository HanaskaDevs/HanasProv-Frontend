import { useState } from 'react';
import SeccionCalificarFicha from './SeccionCalificarFicha';
import SeccionCalificarDocumentos from './SeccionCalificarDocumentos';

function IconoExpandir() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}

function IconoContraer() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 14 10 14 10 20" />
      <polyline points="20 10 14 10 14 4" />
      <line x1="14" y1="10" x2="21" y2="3" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}

type Pestana = 'ficha' | 'documentos';

/**
 * Mismo shell (header + botón expandir/contraer) que ModalFichaProveedor,
 * para que se sienta como la misma familia de modales del sistema. Acá,
 * en vez de un stepper de progreso, hay 2 pestañas: Ficha de Proveedor y
 * Documentos -> cada una es su propia sección de calificación completa.
 */
export default function ModalCalificarProveedor({
  idProveedor,
  razonSocial,
  onClose,
}: {
  idProveedor: number;
  razonSocial: string;
  onClose: () => void;
}) {
  const [pestana, setPestana] = useState<Pestana>('ficha');
  const [expandido, setExpandido] = useState(false);

  return (
    <div
      className={`fixed inset-0 bg-brand-900/50 flex items-center justify-center z-50 ${
        expandido ? 'p-2' : 'p-4'
      }`}
    >
      <div
        className={`bg-white rounded-lg shadow-xl flex flex-col transition-[max-width,height] duration-150 ${
          expandido ? 'w-full h-full max-w-none' : 'w-full max-w-6xl h-[90vh]'
        }`}
      >
        <div className="shrink-0 flex items-center justify-between px-6 py-3 border-b border-brand-900/8">
          <div>
            <h2 className="font-display text-lg font-semibold text-brand-900">Calificar proveedor</h2>
            <p className="text-xs text-brand-900/50">{razonSocial}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setExpandido((v) => !v)}
              className="text-brand-900/40 hover:text-brand-900 p-1.5 rounded hover:bg-brand-900/5"
              aria-label={expandido ? 'Contraer' : 'Expandir'}
              title={expandido ? 'Contraer' : 'Expandir'}
            >
              {expandido ? <IconoContraer /> : <IconoExpandir />}
            </button>
            <button
              onClick={onClose}
              className="text-brand-900/40 hover:text-brand-900 text-xl leading-none px-2"
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-1 px-6 pt-3 border-b border-brand-900/8">
          {(
            [
              ['ficha', 'Ficha de Proveedor'],
              ['documentos', 'Documentos'],
            ] as [Pestana, string][]
          ).map(([valor, etiqueta]) => (
            <button
              key={valor}
              onClick={() => setPestana(valor)}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                pestana === valor
                  ? 'border-brand-700 text-brand-700'
                  : 'border-transparent text-brand-900/50 hover:text-brand-900'
              }`}
            >
              {etiqueta}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
          {pestana === 'ficha' ? (
            <SeccionCalificarFicha idProveedor={idProveedor} />
          ) : (
            <SeccionCalificarDocumentos idProveedor={idProveedor} />
          )}
        </div>
      </div>
    </div>
  );
}