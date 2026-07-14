import { type InputHTMLAttributes, forwardRef } from 'react';

interface CampoFichaProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

/**
 * Campo estilo Business Central: "Nombre del campo .......... [valor]" en
 * una sola fila.
 * - El bloque [label + puntitos] tiene un ANCHO FIJO (w-[168px]) para que
 *   todos los inputs de una misma columna arranquen en la misma posición
 *   horizontal -> eso da la alineación tipo tabla.
 * - Dentro de ese bloque, el label NO tiene ancho fijo (solo el ancho de
 *   su texto): los puntitos son el resto flexible, así que siempre
 *   arrancan justo después de la palabra, no a mitad del espacio en
 *   blanco.
 * - El input SIEMPRE se ve como una caja (borde visible), no solo al
 *   hacer foco/hover -> se nota de inmediato que es editable.
 * Vive solo dentro del módulo de Ficha de Proveedor -> no afecta al
 * <Input /> genérico que usan el resto de formularios del sistema.
 */
const CampoFicha = forwardRef<HTMLInputElement, CampoFichaProps>(
  ({ label, error, className = '', ...props }, ref) => {
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
            {/* Línea punteada tipo "tabla de contenidos": arranca justo
                después del texto del label y rellena el resto del bloque
                de ancho fijo, hasta donde empieza el input. */}
            <span
              aria-hidden="true"
              className="h-0 min-w-1 flex-1 border-b border-dotted border-brand-900/35"
            />
          </div>

          <input
            ref={ref}
            id={props.id ?? props.name}
            className={`min-w-0 max-w-[220px] flex-1 rounded-sm border bg-white px-2 py-1 text-[13px]
              text-brand-900 shadow-sm placeholder:text-brand-900/30
              focus:outline-none focus:ring-1 focus:ring-brand-700 focus:border-brand-700
              disabled:cursor-default disabled:bg-brand-900/[0.04] disabled:text-brand-900/70
              disabled:shadow-none disabled:border-brand-900/10
              ${error ? 'border-brand-wine' : 'border-brand-900/20'} ${className}`}
            {...props}
          />
        </div>
        {error && <span className="pl-0.5 text-[11px] text-brand-wine">{error}</span>}
      </div>
    );
  }
);

CampoFicha.displayName = 'CampoFicha';

export default CampoFicha;