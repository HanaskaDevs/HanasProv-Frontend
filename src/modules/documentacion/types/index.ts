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
  /** true = hay una plantilla .docx en blanco descargable para este tipo
   *  (ver documentacionApi.descargarPlantilla) -> ej. "Check list
   *  autoevaluación de proveedores" y "Carta de Garantia". */
  tiene_plantilla: boolean;
  /** true solo en el Certificado bancario: además del PDF, el proveedor
   *  declara banco / tipo de cuenta / nro de cuenta (esos datos son los
   *  que se postean a la Ficha de Bancos de Business Central; del PDF no
   *  se pueden extraer). */
  requiere_datos_bancarios: boolean;
  documentos: DocumentoSubido[];
}

export interface ChecklistDocumentacion {
  registrado: boolean;
  fecha_registro: string | null;
  correcciones_pendientes: boolean;
  documentos: TipoDocumentoChecklist[];
}