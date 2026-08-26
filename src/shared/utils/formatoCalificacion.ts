// src/shared/utils/formatoCalificacion.ts

/**
 * Formato y color de la nota de calificación.
 *
 * Vive aparte del componente CalificacionGlobal por una razón práctica:
 * exportar funciones desde un archivo que también exporta componentes rompe
 * el Fast Refresh de Vite (cada cambio recarga la página entera en vez de
 * refrescar el componente). Y de paso, tres pantallas los usan sin necesitar
 * el componente.
 */

/**
 * Cortes de color de la nota. 90+ es lo esperado de un proveedor al día,
 * 75-89 pasa pero con cosas que atender, y por debajo de 60 la relación tiene
 * un problema real. Son los mismos colores que el resto del portal usa para
 * "bien / atender / mal".
 */
export function colorTexto(nota: number): string {
  if (nota >= 90) return 'text-emerald-700';
  if (nota >= 75) return 'text-brand-700';
  if (nota >= 60) return 'text-amber-700';
  return 'text-brand-wine';
}

export function colorAnillo(nota: number): string {
  if (nota >= 90) return 'stroke-emerald-500';
  if (nota >= 75) return 'stroke-brand-700';
  if (nota >= 60) return 'stroke-amber-500';
  return 'stroke-brand-wine';
}

export function colorBarra(porcentaje: number): string {
  if (porcentaje >= 90) return 'bg-emerald-500';
  if (porcentaje >= 75) return 'bg-brand-700';
  if (porcentaje >= 60) return 'bg-amber-500';
  return 'bg-brand-wine';
}

/** 82.5 -> "82.5", 15 -> "15" (sin decimales inútiles). */
export function formatearNota(valor: number): string {
  return Number.isInteger(valor) ? String(valor) : valor.toFixed(1);
}
