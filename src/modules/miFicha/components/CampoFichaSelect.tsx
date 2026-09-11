// src/modules/miFicha/components/CampoFichaSelect.tsx
import { type SelectHTMLAttributes, forwardRef } from 'react';

/**
 * Una opción puede ser:
 * - un string: se muestra y se envía el mismo texto (caso "Ciudad").
 * - un objeto {valor, etiqueta}: se MUESTRA la etiqueta y se ENVÍA el
 *   valor. Hace falta para los catálogos que tienen que coincidir con
 *   Business Central: en "Clase de contribuyente" el proveedor lee
 *   "Persona Natural" pero lo que viaja es el código "PERSONA NATURAL".
 */
export type OpcionCampoFichaSelect = string | { valor: string; etiqueta: string };

interface CampoFichaSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  placeholder?: string;
  opciones: readonly OpcionCampoFichaSelect[];
  /** Borde/fondo persistente -> "este campo lo rechazó el admin, corrígelo". */
  resaltado?: boolean;
  /** Se renderiza pegado al select (ej. el ícono de observación). */
  accesorio?: React.ReactNode;
}

function normalizar(opcion: OpcionCampoFichaSelect): { valor: string; etiqueta: string } {
  return typeof opcion === 'string' ? { valor: opcion, etiqueta: opcion } : opcion;
}

/**
 * Misma cara que CampoFicha (label + puntitos + caja con ancho fijo, para
 * que todo quede alineado en la misma columna), pero para un <select> en
 * vez de un <input> de texto libre -> se usa para "Ciudad" y para
 * "Clase de contribuyente".
 */
const CampoFichaSelect = forwardRef<HTMLSelectElement, CampoFichaSelectProps>(
  ({ label, error, resaltado = false, accesorio, placeholder = 'Selecciona...', opciones, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-1.5">
          <div className="flex w-[168px] shrink-0 items-center gap-1">
            <label
              htmlFor={props.id ?? props.name}
              className="shrink-0 whitespace-nowrap text-[12.5px] text-brand-900/60"
            >
              {label}
            </label>
            <span
              aria-hidden="true"
              className="h-0 min-w-1 flex-1 border-b border-dotted border-brand-900/35"
            />
          </div>

          <select
            ref={ref}
            id={props.id ?? props.name}
            className={`min-w-0 max-w-[220px] w-full rounded-sm border bg-white px-2 py-1 text-[13px]
              text-brand-900 shadow-sm
              focus:outline-none focus:ring-1 focus:ring-brand-700 focus:border-brand-700
              disabled:cursor-default disabled:bg-brand-900/[0.04] disabled:text-brand-900/70
              disabled:shadow-none disabled:border-brand-900/10
              ${resaltado ? 'border-brand-700 ring-1 ring-brand-200 bg-brand-200/25' : error ? 'border-brand-wine' : 'border-brand-900/20'} ${className}`}
            {...props}
          >
            <option value="">{placeholder}</option>
            {opciones.map((opcion) => {
              const { valor, etiqueta } = normalizar(opcion);
              return (
                <option key={valor} value={valor}>
                  {etiqueta}
                </option>
              );
            })}
          </select>
          {accesorio}
        </div>
        {error && <span className="pl-0.5 text-[12px] text-brand-wine">{error}</span>}
      </div>
    );
  }
);

CampoFichaSelect.displayName = 'CampoFichaSelect';

export default CampoFichaSelect;
