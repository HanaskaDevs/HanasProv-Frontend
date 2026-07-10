interface PaginacionProps {
  paginaActual: number;
  totalPaginas: number;
  onCambiar: (pagina: number) => void;
}

export default function Paginacion({ paginaActual, totalPaginas, onCambiar }: PaginacionProps) {
  if (totalPaginas <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 pt-2">
      <button
        onClick={() => onCambiar(paginaActual - 1)}
        disabled={paginaActual === 1}
        className="px-3 py-1.5 text-sm rounded-md border border-brand-900/15 text-brand-900
          disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-900/5"
      >
        ‹ Anterior
      </button>

      <span className="text-sm text-brand-900/60">
        Página {paginaActual} de {totalPaginas}
      </span>

      <button
        onClick={() => onCambiar(paginaActual + 1)}
        disabled={paginaActual === totalPaginas}
        className="px-3 py-1.5 text-sm rounded-md border border-brand-900/15 text-brand-900
          disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-900/5"
      >
        Siguiente ›
      </button>
    </div>
  );
}