import apiClient from '../../../shared/api/apiClient';

/** Un tramo de urgencia, tal como lo define el backend (ReporteCaducidadService). */
export interface TramoCaducidad {
  clave: string;
  etiqueta: string;
  descripcion: string;
  hasta_dias: number | null;
}

export interface DocumentoPorCaducar {
  id_documento_proveedor: number;
  id_proveedor: number;
  razon_social: string | null;
  nombre_comercial: string | null;
  ruc: string | null;
  /** Correo de Calidad del proveedor, o el general si no cargó ese contacto. */
  email: string | null;
  telefono: string | null;
  /** El proveedor YA está suspendido (no es una advertencia, ya pasó). */
  proveedor_suspendido: boolean;
  id_tipo_documento: number;
  documento: string;
  categoria: string | null;
  fecha_caducidad: string;
  estado_calificacion: string | null;
  /** Última vez que se le avisó por correo. Null = todavía no se le avisó. */
  fecha_ultima_notificacion: string | null;
  /** Negativo = ya venció. 0 = vence hoy. */
  dias_restantes: number;
  tramo: string;
  /**
   * Días que faltan para que este vencimiento suspenda al proveedor.
   * Null mientras el documento no haya vencido: hasta ahí no hay ninguna
   * cuenta regresiva corriendo. Negativo = el plazo de gracia ya se pasó.
   */
  dias_para_suspension: number | null;
}

/**
 * Estado REAL de la suspensión automática. Sin esto la pantalla afirmaba
 * "el proveedor puede quedar suspendido" en todos los vencidos, cuando en
 * realidad hace falta que la fecha ya haya llegado Y que el interruptor de
 * Configuraciones esté encendido.
 */
export interface EstadoSuspension {
  activa: boolean;
  ya_es_exigible: boolean;
  vigente_desde: string;
  dias_gracia: number;
  dias_primer_aviso: number;
}

export interface TipoDocumentoDelReporte {
  id_tipo_documento: number;
  nombre: string;
  categoria: string | null;
}

export interface ReporteCaducidad {
  tramos: TramoCaducidad[];
  documentos: DocumentoPorCaducar[];
  suspension: EstadoSuspension;
  tipos_documento: TipoDocumentoDelReporte[];
}

/**
 * Los tramos vienen del backend junto con los datos, y no escritos acá: los
 * cortes (7 / 15 / 30 días) y sus nombres se definen en un solo lugar, así la
 * pantalla no puede quedar diciendo algo distinto de lo que se calculó.
 */
export async function obtenerReporteCaducidad(): Promise<ReporteCaducidad> {
  const { data } = await apiClient.get<ReporteCaducidad>('/reportes/caducidad-documentos');
  return data;
}
