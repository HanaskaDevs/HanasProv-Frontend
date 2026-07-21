interface BarraBusquedaProps {
  valor: string;
  onCambiar: (valor: string) => void;
  placeholder?: string;
  className?: string;
}

export default function BarraBusqueda({ valor, onCambiar, placeholder = 'Buscar...', className = '' }: BarraBusquedaProps) {
  return (
    <input
      type="text"
      value={valor}
      onChange={(e) => onCambiar(e.target.value)}
      placeholder={placeholder}
      className={`w-full max-w-xs rounded-md border border-brand-900/15 px-3 py-2 text-sm
        focus:outline-none focus:ring-2 focus:ring-brand-700 ${className}`}
    />
  );
}