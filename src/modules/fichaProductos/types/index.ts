export interface UnidadPresentacion {
  Id_Unidad_Presentacion: number;
  Nombre_Unidad: string;
}

export interface DocumentoProducto {
  id_documento_producto: number;
  tipo: string;
  nombre_original: string;
}

export interface Producto {
  id_producto: number;
  nombre_producto: string;
  codigo_barras: string | null;
  unidad_presentacion: string;
  precio: string | null;
  peso: string | null;
  volumen: string | null;
  unidad_por_caja: number | null;
  // true mientras hay una solicitud de cambio de precio pendiente de
  // aprobación (ver SolicitudCambioPrecio en el backend) -> el precio
  // queda de solo lectura hasta que Admin/Calidad la resuelva, el resto
  // del producto sigue disponible con normalidad.
  precio_en_revision: boolean;
  bloqueado: boolean;
  estado_calificacion: 'Pendiente' | 'Aprobado' | 'Rechazado' | null;
  comentario_calificacion: string | null;
  documentos: DocumentoProducto[];
}

export interface NuevoProducto {
  nombre_producto: string;
  codigo_barras?: string;
  id_unidad_presentacion: number;
  precio?: number;
  peso?: number;
  volumen?: number;
  unidad_por_caja?: number;
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