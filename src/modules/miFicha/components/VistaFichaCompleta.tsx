import { Link } from 'react-router-dom';
import CamposFichaSoloLectura from './CamposFichaSoloLectura';
import type { FichaProveedor } from '../types';

export default function VistaFichaCompleta({ ficha }: { ficha: FichaProveedor }) {
  return (
    <div className="space-y-4">
      <div className="rounded-md bg-emerald-50 border border-emerald-200 px-4 py-3">
        <p className="text-sm text-emerald-800">
          Tu ficha está completa. No se puede editar, pero recuerda que el proceso sigue con tu{' '}
          <span className="font-semibold">documentación</span>.
        </p>
        <Link
          to="/documentos"
          className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-800"
        >
          Ir a Documentación
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </div>

      <CamposFichaSoloLectura ficha={ficha} />
    </div>
  );
}