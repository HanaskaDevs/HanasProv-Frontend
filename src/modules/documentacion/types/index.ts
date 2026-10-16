export interface DocumentoSubido {
  id_documento_proveedor: number;
  nombre_original: string;
  fecha_caducidad: string | null;
  /** true si vence en 30 días o menos (o ya venció) -> usado para que
   *  un proveedor YA APROBADO pueda reemplazar este documento puntual
   *  aunque el resto de su documentación ya esté aprobada y bloqueada. */
  /** Está por vencer pero TODAVÍA no venció. */
  proximo_a_vencer: boolean;
  /** Ya venció. Antes no existía y 'proximo_a_vencer' daba verdadero para
   *  los dos casos: la tarjeta decía "Próximo a vencer" sobre un documento
   *  caducado hacía 241 días mientras el panel de inicio decía "caducado". */
  vencido: boolean;
  /** Negativo = venció hace tantos días. Null si el documento no caduca. */
  dias_para_vencer: number | null;
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
  /** Codigo_Archivo del tipo (ej. 'PCNINO'): sirve para enlazar directo a
   *  un documento con /documentos?documento=PCNINO. */
  codigo: string | null;
  /** true = informativo (Plan de contingencia contra el fenómeno del Niño):
   *  se sube y se cambia en cualquier momento, aunque la documentación ya
   *  esté registrada, y no se califica. */
  informativo: boolean;
  documentos: DocumentoSubido[];
}

export interface ChecklistDocumentacion {
  registrado: boolean;
  fecha_registro: string | null;
  correcciones_pendientes: boolean;
  documentos: TipoDocumentoChecklist[];
}
/** Codigo_Archivo del Plan de contingencia contra el fenómeno del Niño. */
export const CODIGO_PLAN_CONTINGENCIA_NINO = 'PCNINO';
