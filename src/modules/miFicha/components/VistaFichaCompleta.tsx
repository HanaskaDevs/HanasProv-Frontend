// src/modules/miFicha/components/VistaFichaCompleta.tsx
import { Link } from 'react-router-dom';
import CamposFichaSoloLectura from './CamposFichaSoloLectura';
import type { FichaProveedor } from '../types';

export default function VistaFichaCompleta({
  ficha,
  documentacionRegistrada,
}: {
  ficha: FichaProveedor;
  /** Si ya registró su documentación al menos una vez -> no tiene
   *  sentido seguir mostrando "el siguiente paso es su documentación"
   *  cada vez que corrige la ficha, si ya pasó de esa etapa hace rato. */
  documentacionRegistrada?: boolean;
}) {
  const aprobada = ficha.estado_calificacion_general === 'Aprobado';

  return (
    <div className="space-y-4">
      <div
        className={`rounded-md border px-4 py-3 ${
          aprobada ? 'bg-emerald-50 border-emerald-200' : 'bg-brand-700/5 border-brand-700/15'
        }`}
      >
        <p className={`text-sm ${aprobada ? 'text-emerald-800' : 'text-brand-900'}`}>
          {aprobada ? (
            <>
              <span className="font-semibold">✓ Su ficha fue aprobada</span> por el equipo.
            </>
          ) : (
            <>
              Su ficha está completa y <span className="font-semibold">pendiente de revisión</span> por parte de
              nuestro equipo. No se puede editar mientras tanto.
            </>
          )}
        </p>
        {!documentacionRegistrada && (
          <>
            <p className={`text-sm mt-1 ${aprobada ? 'text-emerald-800' : 'text-brand-900/70'}`}>
              Recuerde que el proceso sigue con su <span className="font-semibold">documentación</span>.
            </p>
            <Link
              to="/documentos"
              className={`mt-2 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors ${
                aprobada ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-brand-700 hover:bg-brand-900'
              }`}
            >
              Ir a Documentación
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </>
        )}
      </div>

      <CamposFichaSoloLectura ficha={ficha} />
    </div>
  );
}