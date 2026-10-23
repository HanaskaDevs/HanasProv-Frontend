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

/**
 * Datos que el proveedor declaró junto al PDF del certificado bancario.
 * Son los que se postean a la Ficha de Bancos de Business Central, así
 * que Admin/Calidad los contrasta con el PDF antes de aprobarlo.
 */
export interface DatosBancariosDeclarados {
  nombre_banco: string | null;
  /** Código de sucursal que se manda a BC. Solo lo ve Admin/Calidad. */
  codigo_bc_banco: string | null;
  tipo_cuenta: 'AHO' | 'CTE';
  nro_cuenta: string;
  fecha_registro: string | null;
}

export interface TipoDocumentoCalificable {
  id_tipo_documento: number;
  categoria: string;
  nombre_documento: string;
  obligatorio: boolean;
  /** true = informativo (Plan de contingencia Niño): se ve, no se califica. */
  informativo: boolean;
  /** Solo viene en el Certificado bancario; null si aún no los registró. */
  datos_bancarios: DatosBancariosDeclarados | null;
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
  /** 'YYYY-MM-DD' o null. */
  fecha_caducidad: string | null;
  /** El tipo exige fecha (Notificación sanitaria, Análisis de producto). */
  requiere_fecha_caducidad: boolean;
}

export interface ProductoCalificable {
  id_producto: number;
  nombre_producto: string;
  /** Perecibles / No_Perecibles / Fruver; null en productos viejos. */
  clasificacion: 'Perecibles' | 'No_Perecibles' | 'Fruver' | null;
  /** El personal interno se lo ocultó al proveedor: se ve en gris. */
  oculto_proveedor: boolean;
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
 * EL nombre con que se muestra a un proveedor en todo el portal: su RAZÓN
 * SOCIAL, no el nombre comercial ni el de la persona dueña del usuario
 * (pedido explícito del usuario, 23-oct-2026). Es la misma regla que
 * Proveedor::nombreVisible() en el backend.
 *
 * La razón social se pide al activar la cuenta. El respaldo es para un
 * proveedor que todavía no la tiene (un acceso a otra empresa que no llenó
 * la ficha): sin él la celda del nombre quedaba vacía.
 */
export function nombreVisibleProveedor(proveedor: { razon_social?: string | null } | null | undefined): string {
  return proveedor?.razon_social?.trim() || 'Proveedor sin ficha completada';
}
