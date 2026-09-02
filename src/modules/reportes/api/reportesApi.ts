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
  documento: string;
  fecha_caducidad: string;
  estado_calificacion: string | null;
  /** Negativo = ya venció. 0 = vence hoy. */
  dias_restantes: number;
  tramo: string;
}

export interface ReporteCaducidad {
  tramos: TramoCaducidad[];
  documentos: DocumentoPorCaducar[];
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
