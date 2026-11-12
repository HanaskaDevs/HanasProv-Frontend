import apiClient from '../../../shared/api/apiClient';
import type {
  AuditoriaDetalle,
  ImagenObservacion,
  FilaReporteCalificacion,
  ProveedorParaAuditoria,
  ResumenAuditoriasDashboard,
  TipoAuditoria,
} from '../types';

export async function listarTipos(): Promise<TipoAuditoria[]> {
  const { data } = await apiClient.get<TipoAuditoria[]>('/auditorias/tipos');
  return data;
}

/** Resumen para el panel de bienvenida de Calidad. */
export async function obtenerResumen(): Promise<ResumenAuditoriasDashboard> {
  const { data } = await apiClient.get<ResumenAuditoriasDashboard>('/auditorias/resumen');
  return data;
}

/** Mini reporte: la última auditoría de cada proveedor auditado. */
export async function obtenerReporte(): Promise<FilaReporteCalificacion[]> {
  const { data } = await apiClient.get<FilaReporteCalificacion[]>('/auditorias/reporte');
  return data;
}

export async function listarProveedores(idTipoAuditoria?: number): Promise<ProveedorParaAuditoria[]> {
  const { data } = await apiClient.get<ProveedorParaAuditoria[]>('/auditorias/proveedores', {
    params: idTipoAuditoria ? { id_tipo_auditoria: idTipoAuditoria } : undefined,
  });
  return data;
}

export async function iniciar(idTipoAuditoria: number, idProveedor: number): Promise<AuditoriaDetalle> {
  const { data } = await apiClient.post<AuditoriaDetalle>('/auditorias/iniciar', {
    id_tipo_auditoria: idTipoAuditoria,
    id_proveedor: idProveedor,
  });
  return data;
}

export async function obtener(idAuditoria: number): Promise<AuditoriaDetalle> {
  const { data } = await apiClient.get<AuditoriaDetalle>(`/auditorias/${idAuditoria}`);
  return data;
}

export async function guardarRespuesta(
  idAuditoria: number,
  payload: { id_auditoria_pregunta: number; puntaje_obtenido: number | null; no_aplica: boolean; observacion: string | null }
): Promise<AuditoriaDetalle> {
  const { data } = await apiClient.post<AuditoriaDetalle>(`/auditorias/${idAuditoria}/respuestas`, payload);
  return data;
}

export async function finalizar(idAuditoria: number): Promise<AuditoriaDetalle> {
  const { data } = await apiClient.post<AuditoriaDetalle>(`/auditorias/${idAuditoria}/finalizar`);
  return data;
}

// ---------------------------------------------------------------------
// Fotos de la observación (12-nov-2026)
// ---------------------------------------------------------------------

/**
 * Sube UNA foto y devuelve el detalle completo recargado.
 *
 * Se recarga el detalle en vez de insertar la imagen a mano en el estado
 * local: así la pantalla queda con exactamente lo que tiene el servidor
 * (incluida la respuesta vacía que se crea si la pregunta no tenía
 * ninguna), que es como ya funciona el autoguardado de puntajes.
 */
export async function subirImagenObservacion(
  idAuditoria: number,
  idPregunta: number,
  archivo: File
): Promise<ImagenObservacion> {
  const formData = new FormData();
  formData.append('id_auditoria_pregunta', String(idPregunta));
  formData.append('imagen', archivo);

  const { data } = await apiClient.post<ImagenObservacion>(`/auditorias/${idAuditoria}/imagenes`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function eliminarImagenObservacion(idImagen: number): Promise<void> {
  await apiClient.delete(`/auditorias/imagenes/${idImagen}`);
}
