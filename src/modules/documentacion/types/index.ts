export interface DocumentoSubido {
  id_documento_proveedor: number;
  nombre_original: string;
  fecha_caducidad: string | null;
  estado: string;
  fecha_creacion: string;
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