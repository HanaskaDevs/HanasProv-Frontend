// src/modules/proveedores/types/index.ts
export interface ProveedorListado {
  id: number;
  ruc: string | null;
  /**
   * NULL mientras el proveedor no complete su Ficha. Al activar la cuenta
   * el backend crea un "cascarón" de Proveedor por cada empresa, sin datos
   * todavía -> este campo llega vacío hasta que lo llena.
   *
   * Estaba declarado como `string` a secas, y por eso TypeScript no avisó
   * de los `razon_social.toLowerCase()` sueltos que había en las pantallas
   * de listado. Con el tipo correcto, el compilador los marca.
   */
  razon_social: string | null;
  nombre_comercial: string | null;
  email: string | null;
  estado: string | null;
  porcentaje_completado_ficha: number;
  fecha_postulacion: string | null;
  documentacion_registrada: boolean;
  estado_calificacion_ficha: 'Aprobado' | 'Rechazado' | null;
  documentos_totales: number;
  documentos_pendientes_calificar: number;
  documentos_rechazados: number;
  estado_calificacion_documentacion: 'Aprobado' | 'Rechazado' | null;
}

export interface DocumentoCalificable {
  id_documento_proveedor: number;
  nombre_original: string;
  fecha_caducidad: string | null;
  fecha_subida: string | null;
  estado_calificacion: 'Aprobado' | 'Rechazado' | null;
  comentario_calificacion: string | null;
  fecha_calificacion: string | null;
}

export interface TipoDocumentoCalificable {
  id_tipo_documento: number;
  categoria: string;
  nombre_documento: string;
  obligatorio: boolean;
  documentos: DocumentoCalificable[];
}

export interface ChecklistCalificacion {
  razon_social: string;
  documentacion_registrada: boolean;
  calificacion_documentos_registrada: boolean;
  documentos: TipoDocumentoCalificable[];
}

export interface PayloadCalificar {
  aprobado: boolean;
  observacion?: string;
}

export interface DocumentoProductoCalificable {
  id_documento_producto: number;
  nombre_documento: string;
  nombre_original: string;
}

export interface ProductoCalificable {
  id_producto: number;
  nombre_producto: string;
  codigo_barras: string | null;
  unidad_presentacion: string | null;
  precio: string | null;
  estado_calificacion: 'Aprobado' | 'Rechazado' | 'Pendiente' | null;
  comentario_calificacion: string | null;
  fecha_calificacion: string | null;
  documentos: DocumentoProductoCalificable[];
}

export interface ProductosCalificacion {
  razon_social: string;
  calificacion_productos_registrada: boolean;
  productos: ProductoCalificable[];
}
/**
 * Nombre que se le muestra a un proveedor en listados y encabezados.
 *
 * Un proveedor recién activado todavía no tiene Razón Social ni Nombre
 * Comercial (ver ProveedorListado.razon_social), así que sin este respaldo
 * la fila aparecía con la celda del nombre vacía y no se entendía qué era.
 * Vive acá, junto al tipo, para que las tres pantallas que listan
 * proveedores muestren exactamente lo mismo.
 */
export function nombreVisibleProveedor(proveedor: {
  nombre_comercial?: string | null;
  razon_social?: string | null;
}): string {
  return proveedor.nombre_comercial?.trim()
    || proveedor.razon_social?.trim()
    || 'Proveedor sin ficha completada';
}
