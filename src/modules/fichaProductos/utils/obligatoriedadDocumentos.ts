import type { Producto, TipoDocumentoProducto } from '../types';

/**
 * Los tipos con 'obligatorio' resuelto PARA ESTE PRODUCTO: en un producto
 * Fruver la Notificación sanitaria pasa a opcional (22-oct-2026). La regla
 * es del backend (TipoDocumentoProducto::esObligatorioPara) y llega ya
 * resuelta en 'obligatorio_en_fruver'.
 *
 * Sin categoría (productos viejos) se usa la regla general: es la más
 * exigente, y de todas formas el producto no se puede enviar sin elegirla.
 */
export function tiposParaProducto(producto: Producto, tipos: TipoDocumentoProducto[]): TipoDocumentoProducto[] {
  if (producto.clasificacion !== 'Fruver') return tipos;
  return tipos.map((t) => ({ ...t, obligatorio: t.obligatorio_en_fruver }));
}
