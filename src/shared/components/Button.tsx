import { type ButtonHTMLAttributes, type ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
  children: ReactNode;
}

const variantClasses: Record<string, string> = {
  primary: 'bg-brand-900 text-white hover:bg-brand-700 disabled:bg-brand-900/40',
  secondary: 'bg-brand-200 text-brand-900 hover:bg-brand-200/70 disabled:opacity-40',
  danger: 'bg-brand-wine text-white hover:bg-brand-wine/90 disabled:opacity-40',
  ghost: 'bg-transparent text-brand-900 hover:bg-brand-200/40 disabled:opacity-40',
};

export default function Button({
  variant = 'primary',
  isLoading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium cursor-pointer
        transition-all duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:active:scale-100 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {isLoading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      )}
      {children}
    </button>
  );
}