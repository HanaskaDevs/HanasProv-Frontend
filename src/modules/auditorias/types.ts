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