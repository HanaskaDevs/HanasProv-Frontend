export interface DocumentoSubido {
  id_documento_proveedor: number;
  nombre_original: string;
  fecha_caducidad: string | null;
  estado: string;
  fecha_creacion: string;
  estado_calificacion: 'Aprobado' | 'Rechazado' | null;
  comentario_calificacion: string | null;
  fecha_calificacion: string | null;
}

export interface TipoDocumentoChecklist {
  id_tipo_documento: number;
  categoria: string;
  nombre_documento: string;
  obligatorio: boolean;
  permite_multiples: boolean;
  requiere_fecha_caducidad: boolean;
  documentos: DocumentoSubido[];
}

export interface ChecklistDocumentacion {
  registrado: boolean;
  fecha_registro: string | null;
  correcciones_pendientes: boolean;
  documentos: TipoDocumentoChecklist[];
}