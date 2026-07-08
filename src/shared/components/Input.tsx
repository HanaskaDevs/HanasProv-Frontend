import { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className = '', ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-brand-900">{label}</label>}
      <input
        ref={ref}
        className={`rounded-md border px-3 py-2 text-sm text-brand-900 placeholder:text-brand-900/40
          focus:outline-none focus:ring-2 focus:ring-brand-700
          ${error ? 'border-brand-wine' : 'border-brand-900/15'} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-brand-wine">{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
