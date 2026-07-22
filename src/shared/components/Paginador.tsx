function IconoFlechaChica({ className = '' }: { className?: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

/**
 * Minimalista: flechas + puntos, sin números de página. El punto activo
 * se agranda (pastilla) en vez de solo cambiar de color. Pensado para
 * listas/tablas -> va centrado debajo del contenido, a diferencia del
 * paginador de Documentación (ese sí flota a los costados de tarjetas).
 */
export default function Paginador({
  pagina,
  totalPaginas,
  onCambiar,
}: {
  pagina: number;
  totalPaginas: number;
  onCambiar: (pagina: number) => void;
}) {
  if (totalPaginas <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 py-3">
      <button
        onClick={() => onCambiar(pagina - 1)}
        disabled={pagina === 1}
        aria-label="Página anterior"
        className="h-8 w-8 rounded-full flex items-center justify-center bg-brand-700 text-white shadow-sm
          hover:bg-brand-900 disabled:opacity-0 disabled:pointer-events-none transition-all"
      >
        <IconoFlechaChica className="rotate-180" />
      </button>

      <div className="flex items-center gap-1.5">
        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => onCambiar(n)}
            aria-label={`Ir a la página ${n}`}
            className={`rounded-full transition-all duration-200 ${
              n === pagina ? 'h-2 w-5 bg-brand-700' : 'h-2 w-2 bg-brand-900/15 hover:bg-brand-900/30'
            }`}
          />
        ))}
      </div>

      <button
        onClick={() => onCambiar(pagina + 1)}
        disabled={pagina === totalPaginas}
        aria-label="Página siguiente"
        className="h-8 w-8 rounded-full flex items-center justify-center bg-brand-700 text-white shadow-sm
          hover:bg-brand-900 disabled:opacity-0 disabled:pointer-events-none transition-all"
      >
        <IconoFlechaChica />
      </button>
    </div>
  );
}