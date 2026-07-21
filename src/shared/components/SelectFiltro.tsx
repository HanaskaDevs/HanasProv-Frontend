interface Opcion {
  valor: string;
  etiqueta: string;
}

interface SelectFiltroProps {
  valor: string;
  onCambiar: (valor: string) => void;
  opciones: Opcion[];
  etiquetaTodos?: string;
  className?: string;
}

export default function SelectFiltro({ valor, onCambiar, opciones, etiquetaTodos = 'Todos', className = '' }: SelectFiltroProps) {
  return (
    <select
      value={valor}
      onChange={(e) => onCambiar(e.target.value)}
      className={`rounded-md border border-brand-900/15 px-3 py-2 text-sm text-brand-900
        focus:outline-none focus:ring-2 focus:ring-brand-700 ${className}`}
    >
      <option value="">{etiquetaTodos}</option>
      {opciones.map((o) => (
        <option key={o.valor} value={o.valor}>
          {o.etiqueta}
        </option>
      ))}
    </select>
  );
}