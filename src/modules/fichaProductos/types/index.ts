export interface UnidadPresentacion {
  Id_Unidad_Presentacion: number;
  Nombre_Unidad: string;
}

export interface DocumentoProducto {
  id_documento_producto: number;
  id_tipo_documento_producto: number;
  tipo: string;
  nombre_original: string;
  fecha_caducidad: string | null;
}

/**
 * Catálogo de tipos de documento de producto -> viene del backend
 * (GET /mis-productos/tipos-documento), ya no está hardcodeado en el
 * frontend. Ver ModalDocumentosProducto.tsx.
 */
export interface TipoDocumentoProducto {
  id_tipo_documento_producto: number;
  nombre_documento: string;
  carpeta_slug: string;
  obligatorio: boolean;
  permite_multiples: boolean;
  requiere_fecha_caducidad: boolean;
}

/**
 * Grupo de producto (EK, CD, PH, IM...). Es un catálogo administrable
 * desde Catálogos, así que la lista NO se escribe acá: llega del backend
 * (GET /catalogos/grupos-producto).
 */
export interface GrupoProducto {
  id_grupo_producto: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
}

export interface Producto {
  id_producto: number;
  nombre_producto: string;
  codigo_barras: string | null;
  unidad_presentacion: string;
  /** El id, además del nombre: es lo que necesita el <select> al editar. */
  id_unidad_presentacion: number;
  precio: string | null;
  peso: string | null;
  /** Calculado de las medidas de la unidad, no se escribe a mano. */
  volumen: string | null;
  /** Calculado de las medidas del masterpack. */
  volumen_masterpack: string | null;
  /** En pantalla: "Unidades x Masterpack (caja)". */
  unidad_por_caja: number | null;
  /** Solo cuando la unidad de presentación es "Paquete". */
  contenido_paquete: number | null;
  masterpack_largo_cm: string | null;
  masterpack_ancho_cm: string | null;
  masterpack_alto_cm: string | null;
  unidad_largo_cm: string | null;
  unidad_ancho_cm: string | null;
  unidad_alto_cm: string | null;
  // true mientras hay una solicitud de cambio de precio pendiente de
  // aprobación (ver SolicitudCambioPrecio en el backend) -> el precio
  // queda de solo lectura hasta que Admin/Calidad la resuelva, el resto
  // del producto sigue disponible con normalidad.
  precio_en_revision: boolean;
  bloqueado: boolean;
  estado_calificacion: 'Pendiente' | 'Aprobado' | 'Rechazado' | null;
  comentario_calificacion: string | null;
  /** Opcional y múltiple: puede venir vacío. */
  grupos: GrupoProducto[];
  documentos: DocumentoProducto[];
}

export interface NuevoProducto {
  nombre_producto: string;
  codigo_barras?: string;
  id_unidad_presentacion: number;
  precio?: number;
  peso?: number;
  unidad_por_caja?: number;
  contenido_paquete?: number;
  // Medidas en centímetros, todas opcionales. 'volumen' NO se manda: lo
  // calcula el backend a partir de las medidas de la unidad.
  masterpack_largo_cm?: number;
  masterpack_ancho_cm?: number;
  masterpack_alto_cm?: number;
  unidad_largo_cm?: number;
  unidad_ancho_cm?: number;
  unidad_alto_cm?: number;
  /**
   * Ids de los grupos elegidos. Al EDITAR, mandar [] es la forma de
   * quitarle todos los grupos al producto, y no mandar la clave deja los
   * que ya tenía -> son dos cosas distintas, no las unifiques.
   */
  grupos?: number[];
}

/**
 * Proveedor tal como lo ve el comprador en el selector de "Productos por
 * proveedor", con el estado de su catálogo para saber a quién entrar.
 */
export interface ProveedorConProductos {
  id_proveedor: number;
  razon_social: string | null;
  nombre_comercial: string | null;
  ruc: string | null;
  estado: string | null;
  total_productos: number;
  productos_pendientes: number;
  productos_aprobados: number;
  productos_rechazados: number;
}

export interface SolicitudCambioPrecio {
  id_solicitud_cambio_precio: number;
  precio_anterior: string;
  precio_nuevo: string;
  estado: 'Pendiente' | 'Aprobado' | 'Rechazado';
  fecha_solicitud: string;
  comentario_resolucion: string | null;
  producto: { id_producto: number; nombre_producto: string };
  proveedor: { id_proveedor: number; razon_social: string } | null;
  solicitante: { id_usuario: number; nombre_completo: string };
}

export interface ResumenRegistro {
  total_productos: number;
  productos_incompletos: string[];
  puede_registrar: boolean;
  productos_en_revision: number;
  productos_totales_catalogo: number;
  productos_aprobados: number;
  productos_rechazados: number;
  correcciones_pendientes: boolean;
}