import { type InputHTMLAttributes, forwardRef } from 'react';

interface CampoFichaProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

/**
 * Campo compacto estilo Business Central: sin caja con borde completo,
 * solo una línea inferior, etiqueta pequeña en mayúsculas. Vive solo
 * dentro del módulo de Ficha de Proveedor -> no afecta al <Input />
 * genérico que usan el resto de formularios del sistema.
 */
const CampoFicha = forwardRef<HTMLInputElement, CampoFichaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-0.5">
        <label className="text-[11px] font-medium text-brand-900/50 uppercase tracking-wide">
          {label}
        </label>
        <input
          ref={ref}
          className={`border-0 border-b bg-transparent py-1 text-sm text-brand-900
            placeholder:text-brand-900/30 focus:outline-none focus:border-brand-700
            ${error ? 'border-brand-wine' : 'border-brand-900/20'} ${className}`}
          {...props}
        />
        {error && <span className="text-[11px] text-brand-wine">{error}</span>}
      </div>
    );
  }
);

CampoFicha.displayName = 'CampoFicha';

export default CampoFicha;