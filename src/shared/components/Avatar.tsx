function obtenerIniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/);
  const iniciales = partes.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '');
  return iniciales.join('');
}

export default function Avatar({ nombre, className = 'h-8 w-8' }: { nombre: string; className?: string }) {
  return (
    <div
      className={`${className} rounded-full bg-brand-yellow text-brand-900 flex items-center justify-center text-xs font-semibold shrink-0`}
    >
      {obtenerIniciales(nombre)}
    </div>
  );
}