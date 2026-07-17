// src/modules/proveedores/types/index.ts
export interface ProveedorListado {
  id: number;
  ruc: string | null;
  razon_social: string;
  nombre_comercial: string | null;
  email: string | null;
  estado: string | null;
  porcentaje_completado_ficha: number;
  fecha_postulacion: string | null;
  documentacion_registrada: boolean;
  estado_calificacion_ficha: 'Aprobado' | 'Rechazado' | null;
  documentos_totales: number;
  documentos_pendientes_calificar: number;
}

export interface DocumentoCalificable {
  id_documento_proveedor: number;
  nombre_original: string;
  fecha_caducidad: string | null;
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
  documentos: TipoDocumentoCalificable[];
}

export interface PayloadCalificar {
  aprobado: boolean;
  observacion?: string;
}