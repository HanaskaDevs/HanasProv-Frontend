import apiClient from '../../../shared/api/apiClient';
import type {
  CalificacionRecepcionDetalle,
  CalificacionRecepcionHistorial,
  FilaReporteCalificacion,
  ProveedorParaRecepcion,
} from '../types';

const BASE = '/calificacion-recepciones';

export async function listarProveedores(): Promise<ProveedorParaRecepcion[]> {
  const { data } = await apiClient.get<ProveedorParaRecepcion[]>(`${BASE}/proveedores`);
  return data;
}

/** Mini reporte: la última calificación de cada proveedor calificado. */
export async function obtenerReporte(): Promise<FilaReporteCalificacion[]> {
  const { data } = await apiClient.get<FilaReporteCalificacion[]>(`${BASE}/reporte`);
  return data;
}

export async function listarHistorial(): Promise<CalificacionRecepcionHistorial[]> {
  const { data } = await apiClient.get<CalificacionRecepcionHistorial[]>(`${BASE}/historial`);
  return data;
}

/** Retoma el borrador del proveedor o arranca uno nuevo. */
export async function iniciar(payload: {
  id_proveedor: number;
  fecha_recepcion?: string;
  contacto?: string;
}): Promise<CalificacionRecepcionDetalle> {
  const { data } = await apiClient.post<CalificacionRecepcionDetalle>(`${BASE}/iniciar`, payload);
  return data;
}

export async function obtener(idCalificacion: number): Promise<CalificacionRecepcionDetalle> {
  const { data } = await apiClient.get<CalificacionRecepcionDetalle>(`${BASE}/${idCalificacion}`);
  return data;
}

export async function actualizarCabecera(
  idCalificacion: number,
  payload: { fecha_recepcion?: string; contacto?: string }
): Promise<CalificacionRecepcionDetalle> {
  const { data } = await apiClient.put<CalificacionRecepcionDetalle>(`${BASE}/${idCalificacion}/cabecera`, payload);
  return data;
}

/**
 * Autoguardado de un parámetro. Devuelve el detalle completo (con el
 * resumen recalculado) para que el puntaje en pantalla salga del servidor
 * y no de una cuenta hecha en el navegador.
 */
export async function guardarRespuesta(
  idCalificacion: number,
  payload: { id_recepcion_parametro: number; cumple: boolean; observacion: string | null }
): Promise<CalificacionRecepcionDetalle> {
  const { data } = await apiClient.post<CalificacionRecepcionDetalle>(`${BASE}/${idCalificacion}/respuestas`, payload);
  return data;
}

export async function finalizar(idCalificacion: number): Promise<CalificacionRecepcionDetalle> {
  const { data } = await apiClient.post<CalificacionRecepcionDetalle>(`${BASE}/${idCalificacion}/finalizar`);
  return data;
}
