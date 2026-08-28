/**
 * Iniciales de un nombre, tolerando que no haya nombre.
 *
 * El parámetro acepta null/undefined a propósito. Antes exigía `string` y
 * hacía `nombre.trim()` de una: cuando llegó el primer proveedor sin Razón
 * Social (el "cascarón" que se crea al activar la cuenta, antes de que
 * complete su ficha), esa línea lanzaba una excepción y React desmontaba el
 * árbol entero -> la pantalla de Proveedores quedaba COMPLETAMENTE EN
 * BLANCO, sin ningún mensaje.
 *
 * Un componente de presentación tan usado no puede tumbar una pantalla por
 * un dato faltante: si no hay nombre, muestra un guion y sigue.
 */
function obtenerIniciales(nombre: string | null | undefined): string {
  const limpio = nombre?.trim();

  if (!limpio) return '—';

  const partes = limpio.split(/\s+/);
  const iniciales = partes.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '');

  // Un nombre que es solo signos ("---") deja las iniciales vacías y el
  // círculo se vería en blanco; ahí también corresponde el guion.
  return iniciales.join('') || '—';
}

export default function Avatar({
  nombre,
  className = 'h-8 w-8',
}: {
  nombre: string | null | undefined;
  className?: string;
}) {
  return (
    <div
      className={`${className} rounded-full bg-brand-yellow text-brand-900 flex items-center justify-center text-xs font-semibold shrink-0`}
    >
      {obtenerIniciales(nombre)}
    </div>
  );
}
