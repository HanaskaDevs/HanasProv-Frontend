import type { DocumentoPorCaducar } from '../api/reportesApi';

/**
 * Paleta por tramo. Las claves las define el backend
 * (ReporteCaducidadService::TRAMOS), no este archivo.
 *
 * EL COLOR NUNCA ES EL ÚNICO AVISO. Cada fila lleva además la fecha y los
 * días escritos en palabras, y cada tramo su título: quien no distinga rojo
 * de ámbar (una de cada doce personas tiene alguna dificultad con eso)
 * recibe exactamente la misma información.
 */
export const ESTILO_TRAMO: Record<
  string,
  { barra: string; chip: string; chipActivo: string; borde: string; punto: string; texto: string }
> = {
  vencido: {
    barra: 'bg-red-600',
    chip: 'bg-red-50 text-red-800 border-red-200',
    chipActivo: 'bg-red-600 text-white border-red-600',
    borde: 'border-l-red-600',
    punto: 'bg-red-600',
    texto: 'text-red-700',
  },
  critico: {
    barra: 'bg-orange-500',
    chip: 'bg-orange-50 text-orange-800 border-orange-200',
    chipActivo: 'bg-orange-500 text-white border-orange-500',
    borde: 'border-l-orange-500',
    punto: 'bg-orange-500',
    texto: 'text-orange-700',
  },
  urgente: {
    barra: 'bg-amber-400',
    chip: 'bg-amber-50 text-amber-900 border-amber-200',
    chipActivo: 'bg-amber-400 text-amber-950 border-amber-400',
    borde: 'border-l-amber-400',
    punto: 'bg-amber-400',
    texto: 'text-amber-700',
  },
  proximo: {
    barra: 'bg-sky-500',
    chip: 'bg-sky-50 text-sky-800 border-sky-200',
    chipActivo: 'bg-sky-500 text-white border-sky-500',
    borde: 'border-l-sky-500',
    punto: 'bg-sky-500',
    texto: 'text-sky-700',
  },
  holgado: {
    barra: 'bg-emerald-500',
    chip: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    chipActivo: 'bg-emerald-500 text-white border-emerald-500',
    borde: 'border-l-emerald-500',
    punto: 'bg-emerald-500',
    texto: 'text-emerald-700',
  },
};

export const ESTILO_TRAMO_POR_DEFECTO = ESTILO_TRAMO.holgado;

/** "vence en 3 días" / "venció hace 5 días" / "vence hoy", en palabras. */
export function textoDeDias(dias: number): string {
  if (dias < 0) return `Venció hace ${Math.abs(dias)} ${Math.abs(dias) === 1 ? 'día' : 'días'}`;
  if (dias === 0) return 'Vence hoy';
  return `Vence en ${dias} ${dias === 1 ? 'día' : 'días'}`;
}

export function formatearFecha(fecha: string): string {
  // Se parte el texto en vez de usar new Date(): "2026-09-03" se interpreta
  // como UTC y en nuestra zona retrocede un día.
  const [anio, mes, dia] = fecha.slice(0, 10).split('-');
  return `${dia}/${mes}/${anio}`;
}

export function nombreProveedor(d: DocumentoPorCaducar): string {
  return d.nombre_comercial?.trim() || d.razon_social?.trim() || 'Proveedor sin ficha completada';
}
