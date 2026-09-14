import { type InputHTMLAttributes, forwardRef, useState } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  /**
   * Unidad de medida que se dibuja DENTRO del campo, pegada al borde
   * derecho ("cm", "kg", "USD").
   *
   * Adentro y no como parte de la etiqueta: la etiqueta se lee una vez
   * al llegar al campo y después se olvida, mientras que el sufijo queda
   * a la vista justo donde se está escribiendo el número. En un grupo de
   * tres casillas iguales (largo / ancho / altura) es la diferencia
   * entre cargar 50 cm y cargar 50 m.
   */
  sufijo?: string;
  /** Color del texto de error -> por defecto rojo (brand-wine), pero
   *  en fondos oscuros/fotos (ver CampoOscuro en las pantallas de auth)
   *  puede convenir otro tono sin tener que cambiarlo para toda la app. */
  errorClassName?: string;
  /** Color del ícono del ojito (mostrar/ocultar contraseña) -> mismo
   *  motivo que errorClassName: por defecto pensado para fondos claros. */
  toggleClassName?: string;
}

function IconoOjo({ className = '' }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconoOjoTachado({ className = '' }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-3.22 2.75A9.12 9.12 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 4.22-5.94" />
      <path d="M9.53 9.53a3 3 0 0 0 4.24 4.24" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, sufijo, errorClassName = 'text-brand-wine', toggleClassName = 'text-brand-900/50 hover:text-brand-900/80', className = '', type, ...props }, ref) => {
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const esPassword = type === 'password';

    return (
      <div className="flex flex-col gap-1">
        {label && <label className="text-sm font-medium text-brand-900">{label}</label>}
        <div className="relative">
          <input
            ref={ref}
            type={esPassword && mostrarPassword ? 'text' : type}
            className={`rounded-md border px-3 py-2 text-sm text-brand-900 placeholder:text-brand-900/40 w-full
              focus:outline-none focus:ring-2 focus:ring-brand-700
              ${esPassword ? 'pr-10' : ''}
              ${sufijo
                ? // Espacio para el sufijo, y fuera las flechitas del
                  // type="number": el navegador las dibuja en ese mismo
                  // borde derecho y se montarían encima del texto.
                  'pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                : ''}
              ${error ? 'border-brand-wine' : 'border-brand-900/15'} ${className}`}
            {...props}
          />

          {sufijo && (
            // pointer-events-none para que tocar sobre el sufijo enfoque
            // el campo igual, en vez de no hacer nada.
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-brand-900/35"
            >
              {sufijo}
            </span>
          )}
          {esPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setMostrarPassword((v) => !v)}
              aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className={`absolute right-2.5 top-1/2 -translate-y-1/2 transition-opacity ${toggleClassName}`}
            >
              {mostrarPassword ? <IconoOjoTachado /> : <IconoOjo />}
            </button>
          )}
        </div>
        {error && <span className={`text-xs ${errorClassName}`}>{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;