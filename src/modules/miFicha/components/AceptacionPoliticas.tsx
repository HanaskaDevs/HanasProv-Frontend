// src/modules/miFicha/components/AceptacionPoliticas.tsx
import { Link } from 'react-router-dom';

function IconoEscudo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

/**
 * Casilla "acepto las Políticas de Hanaska" que aparece SOLO en el guardado
 * que completa la ficha, porque ese es el que la envía a revisión del
 * equipo (ver ModalFichaProveedor). Son POLÍTICAS, no "términos y
 * condiciones": es el nombre con el que Hanaska las publica en el portal
 * (pantalla Políticas) y así hay que llamarlas.
 *
 * La casilla del navegador es comodidad: el backend rechaza con 422 el
 * guardado que completa la ficha si no viene aceptada, y es él quien deja
 * la fecha en Confirmacion_Ficha.
 */
export default function AceptacionPoliticas({
  aceptado,
  onChange,
  error,
}: {
  aceptado: boolean;
  onChange: (aceptado: boolean) => void;
  error?: string | null;
}) {
  return (
    <div
      className={`rounded-lg border px-4 py-3 ${
        error ? 'border-brand-wine/40 bg-brand-wine/[0.03]' : 'border-brand-900/15 bg-brand-200/15'
      }`}
    >
      <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-900 uppercase tracking-wide">
        <span className="text-brand-700">
          <IconoEscudo />
        </span>
        Antes de enviar su ficha a revisión
      </p>

      <label className="mt-2 flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={aceptado}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-brand-900"
          aria-invalid={Boolean(error)}
        />
        <span className="text-sm text-brand-900/80 leading-relaxed">
          Declaro que la información registrada en esta ficha es verídica y que he leído y acepto las{' '}
          <Link
            to="/politicas"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-brand-700 underline hover:text-brand-900"
          >
            Políticas de Hanaska
          </Link>{' '}
          para proveedores. Entiendo que, al enviarla, mi ficha pasará a revisión del equipo de Hanaska y
          que quedará registrada la fecha de esta aceptación.
        </span>
      </label>

      {error && <p className="mt-2 text-sm text-brand-wine">{error}</p>}
    </div>
  );
}
