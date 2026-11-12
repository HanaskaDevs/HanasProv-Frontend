import apiClient from '../../../shared/api/apiClient';
import type {
  CalificacionRecepcionDetalle,
  ImagenObservacion,
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

// ---------------------------------------------------------------------
// Fotos de la observación (12-nov-2026)
// ---------------------------------------------------------------------

/**
 * Sube UNA foto a la observación de un parámetro.
 *
 * El parámetro tiene que estar respondido (Sí/No) antes: la foto cuelga
 * de la fila de respuesta, que no admite "sin responder". Si no lo está,
 * el backend contesta 422 con ese mensaje.
 */
export async function subirImagenObservacion(
  idCalificacion: number,
  idParametro: number,
  archivo: File
): Promise<ImagenObservacion> {
  const formData = new FormData();
  formData.append('id_recepcion_parametro', String(idParametro));
  formData.append('imagen', archivo);

  const { data } = await apiClient.post<ImagenObservacion>(
    `${BASE}/${idCalificacion}/imagenes`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return data;
}

export async function eliminarImagenObservacion(idImagen: number): Promise<void> {
  await apiClient.delete(`${BASE}/imagenes/${idImagen}`);
}
