export interface DocumentoSubido {
  id_documento_proveedor: number;
  nombre_original: string;
  fecha_caducidad: string | null;
  /** true si vence en 30 días o menos (o ya venció) -> usado para que
   *  un proveedor YA APROBADO pueda reemplazar este documento puntual
   *  aunque el resto de su documentación ya esté aprobada y bloqueada. */
  proximo_a_vencer: boolean;
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