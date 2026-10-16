/**
 * Razón social y nombre comercial van SIEMPRE en mayúsculas, y si el
 * proveedor no tiene nombre comercial se usa la razón social (16-oct-2026).
 *
 * La regla de verdad vive en el backend (Proveedor::booted), que es el que
 * guarda. Esto es para que la pantalla muestre lo mismo que va a quedar
 * guardado mientras el proveedor escribe, y para que las fichas que todavía
 * no pasaron por la migración no muestren "N/A".
 */

/** Para `register(campo, { setValueAs })`: lo que viaja al backend ya va en mayúsculas. */
export function aMayusculas(valor: unknown): unknown {
  return typeof valor === 'string' ? valor.toUpperCase() : valor;
}

export const PLACEHOLDER_NOMBRE_COMERCIAL = 'Si no tienes, se usa la razón social';

/** El nombre comercial que corresponde mostrar: el propio, o la razón social si no tiene. */
export function nombreComercialVisible(nombreComercial: string | null | undefined, razonSocial: string | null | undefined): string {
  const propio = (nombreComercial ?? '').trim();
  const sinNombre = propio === '' || propio.toUpperCase() === 'N/A';

  return (sinNombre ? (razonSocial ?? '') : propio).toUpperCase();
}
