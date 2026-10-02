import { useQuery } from '@tanstack/react-query';
import * as responsablesApi from '../api/responsablesApi';

function IconoSobre() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function IconoTelefono() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

/**
 * "Para dudas o inquietudes contáctese con..." — la persona de Hanaska
 * asignada a este proveedor.
 *
 * SI NO TIENE RESPONSABLE, NO SE DIBUJA NADA (decisión del usuario,
 * 02-oct-2026): no hay casilla genérica de relleno. La asignación se
 * resuelve por el código de proveedor de BC, y cuando el proveedor
 * todavía no lo tiene guardado se busca por su RUC en la tabla espejo de
 * BC, así que un proveedor en pleno registro igual ve su contacto.
 */
export default function TarjetaMiResponsable({
  className = '',
  variante = 'tarjeta',
}: {
  className?: string;
  /**
   * 'menu' es la versión para el desplegable del usuario: sin borde ni
   * fondo propios, porque ya está dentro de un panel, y con los colores
   * heredados del contenedor (el menú móvil es oscuro).
   */
  variante?: 'tarjeta' | 'menu';
}) {
  const { data: responsable } = useQuery({
    queryKey: ['mi-responsable'],
    queryFn: responsablesApi.obtenerMiResponsable,
    retry: false,
    staleTime: 10 * 60 * 1000,
  });

  if (!responsable) return null;

  if (variante === 'menu') {
    return (
      <div className={`px-4 py-2.5 ${className}`}>
        <p className="text-[11px] uppercase tracking-wide opacity-50">Su contacto en Hanaska</p>
        <p className="text-sm font-medium mt-0.5">{responsable.nombre}</p>
        <a href={`mailto:${responsable.correo}`} className="flex items-center gap-1.5 text-xs mt-1 hover:underline">
          <IconoSobre />
          <span className="truncate">{responsable.correo}</span>
        </a>
        {responsable.telefono && (
          <a href={`tel:${responsable.telefono}`} className="flex items-center gap-1.5 text-xs mt-0.5 hover:underline">
            <IconoTelefono />
            {responsable.telefono}
          </a>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-brand-900/8 bg-brand-200/30 px-4 py-3 ${className}`}>
      <p className="text-xs text-brand-900/55">Para dudas o inquietudes contáctese con</p>
      <p className="text-sm font-medium text-brand-900 mt-0.5">{responsable.nombre}</p>

      <div className="flex items-center gap-x-4 gap-y-1 flex-wrap mt-1.5">
        <a
          href={`mailto:${responsable.correo}`}
          className="flex items-center gap-1.5 text-xs text-brand-700 hover:underline"
        >
          <IconoSobre />
          {responsable.correo}
        </a>

        {responsable.telefono && (
          <a
            href={`tel:${responsable.telefono}`}
            className="flex items-center gap-1.5 text-xs text-brand-700 hover:underline"
          >
            <IconoTelefono />
            {responsable.telefono}
          </a>
        )}
      </div>
    </div>
  );
}
