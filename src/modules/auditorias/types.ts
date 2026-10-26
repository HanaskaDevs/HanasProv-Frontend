export interface TipoAuditoria {
  id_tipo_auditoria: number;
  nombre: string;
}

export interface ProveedorParaAuditoria {
  id_proveedor: number;
  razon_social: string;
  nombre_comercial: string | null;
  ruc: string | null;
  estado: string | null;
  clases: string[];
  /** true = alguna Clase de Proveedor de este proveedor corresponde al
   *  Tipo_Auditoria elegido (ver Tipo_Auditoria_Clase en el backend) ->
   *  el front lo usa para sugerirlo primero en la lista. */
  sugerido: boolean;
  /** true = hoy entrega: calendario de horarios con el día de hoy Y pedido
   *  con recepción esperada hoy. Solo a esos se les empieza una auditoría. */
  tiene_entrega_hoy: boolean;
}

export interface PreguntaAuditoria {
  id_auditoria_pregunta: number;
  subseccion: string | null;
  numero: number;
  descripcion: string;
  puntaje_max: number;
  puntaje_obtenido: number | null;
  no_aplica: boolean;
  observacion: string | null;
}

export interface SeccionAuditoria {
  id_auditoria_seccion: number;
  nombre_seccion: string;
  preguntas: PreguntaAuditoria[];
}

export interface ResumenAuditoria {
  puntaje_total_posible: number;
  puntaje_no_aplica: number;
  puntaje_total_aplica: number;
  puntaje_total_obtenido: number;
  porcentaje_cumplimiento: number;
}

export interface AuditoriaDetalle {
  id_auditoria: number;
  estado: 'Borrador' | 'Finalizada';
  fecha_auditoria: string;
  tipo_auditoria: TipoAuditoria;
  proveedor: {
    id_proveedor: number;
    razon_social: string;
    nombre_comercial: string | null;
    ruc: string | null;
    estado: string | null;
    clases: string[];
  };
  auditor: string | null;
  secciones: SeccionAuditoria[];
  resumen: ResumenAuditoria;
}

// ---------------------------------------------------------------------
// Calificación de Recepciones (formulario FGH04.15.05-1)
// ---------------------------------------------------------------------

export interface ProveedorParaRecepcion {
  id_proveedor: number;
  razon_social: string;
  nombre_comercial: string | null;
  ruc: string | null;
  estado: string | null;
  /** Propuesto hoy: calendario Y pedido hoy, sin la calificación del año. Como máximo 3 por día. */
  le_toca_hoy: boolean;
  calificaciones_del_anio: number;
  /** false = ya llegó al máximo de 2 en el año, o (desde 2027) le faltan documentos. */
  puede_calificar: boolean;
  /** Solo en los propuestos del día; null en el resto. */
  documentacion: {
    faltantes: string[];
    vencidos: string[];
    /** Vigentes que vencen en los próximos 30 días: lo único que muestra el aviso. */
    por_vencer: { documento: string; fecha_caducidad: string }[];
    al_dia: boolean;
  } | null;
  /** false en 2026: la documentación incompleta solo se informa; desde 2027 frena. */
  exige_documentacion: boolean;
  ultima_calificacion: {
    id_calificacion_recepcion: number;
    fecha_recepcion: string | null;
    porcentaje_obtenido: number | null;
  } | null;
}

export interface ParametroRecepcion {
  id_recepcion_parametro: number;
  orden: number;
  descripcion: string;
  puntaje: number;
  /** Casi siempre "Si"/"No", salvo Puntualidad de Entrega. */
  etiqueta_afirmativa: string;
  etiqueta_negativa: string;
  /** null = todavía sin responder (distinto de haber respondido que no). */
  cumple: boolean | null;
  observacion: string | null;
}

export interface ResumenRecepcion {
  puntaje_total_posible: number;
  puntaje_obtenido: number;
  porcentaje_obtenido: number;
  respondidos: number;
  total_parametros: number;
}

export interface CalificacionRecepcionDetalle {
  id_calificacion_recepcion: number;
  estado: 'Borrador' | 'Finalizada';
  finalizada: boolean;
  fecha_recepcion: string | null;
  contacto: string | null;
  proveedor: {
    id_proveedor: number;
    razon_social: string;
    nombre_comercial: string | null;
    ruc: string | null;
    estado: string | null;
  };
  auditor: string | null;
  parametros: ParametroRecepcion[];
  resumen: ResumenRecepcion;
}

export interface CalificacionRecepcionHistorial {
  id_calificacion_recepcion: number;
  fecha_recepcion: string | null;
  proveedor: string | null;
  ruc: string | null;
  contacto: string | null;
  auditor: string | null;
  puntaje_obtenido: number;
  puntaje_total_posible: number;
  porcentaje_obtenido: number;
}

/** Resumen para el panel de bienvenida de Calidad. */
export interface ResumenAuditoriasDashboard {
  auditorias_mes: number;
  promedio_cumplimiento_mes: number | null;
  auditorias_en_borrador: number;
  ultimas: {
    id_auditoria: number;
    proveedor: string | null;
    fecha_auditoria: string | null;
    porcentaje_cumplimiento: number;
  }[];
}

/**
 * Una fila del mini reporte de Auditorías / Recepciones: la ÚLTIMA
 * calificación finalizada de un proveedor y cuántas lleva en total.
 */
export interface FilaReporteCalificacion {
  id_proveedor: number;
  proveedor: string | null;
  ruc: string | null;
  /** Solo en Auditorías. */
  tipo_auditoria?: string | null;
  fecha: string | null;
  auditor: string | null;
  porcentaje: number;
  cantidad: number;
}
